package com.ecommerce.inventory.event;

import com.ecommerce.inventory.service.InventoryService;
import com.ecommerce.inventory.service.EventDeduplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class InventoryConsumer {

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private InventoryProducer inventoryProducer;

    @Autowired
    private EventDeduplicationService eventDeduplicationService;

    @KafkaListener(topics = "order-created", groupId = "inventory-group")
    public void handleOrderCreated(OrderCreatedEvent event) {
        String eventKey = "order-created:" + event.orderId();
        if (!eventDeduplicationService.tryStartProcessing(eventKey)) {
            return;
        }
        System.out.println("Inventory Service received Order Created: " + event.orderId());

        try {
            inventoryService.reserveOrderItems(event.orderId(), event.items());
            inventoryProducer.publishInventoryReserved(event.orderId(), event.totalAmount());
            System.out.println("Stock reserved for order: " + event.orderId());
        } catch (Exception e) {
            eventDeduplicationService.markFailed(eventKey);
            System.err.println("Failed to reserve stock: " + e.getMessage());
            inventoryProducer.publishInventoryFailed(event.orderId(), e.getMessage());
        }
    }

    @KafkaListener(topics = {"payment-failed", "inventory-failed"}, groupId = "inventory-group")
    public void handleCompensation(org.apache.kafka.clients.consumer.ConsumerRecord<String, Object> record) {
        // Simple compensation logic: Release stock if payment fails
        // We use ConsumerRecord to handle multiple event types or use specific DTOs
        // For simplicity, assuming the key is orderId
        String orderIdStr = record.key();
        if (orderIdStr != null) {
             Long orderId = Long.valueOf(orderIdStr);
             String eventKey = record.topic() + ":" + orderId;
             if (!eventDeduplicationService.tryStartProcessing(eventKey)) {
                 return;
             }
             System.out.println("Inventory Service received compensation event for order: " + orderId);
             try {
                 inventoryService.releaseReservation(orderId);
                 System.out.println("Stock released for order: " + orderId);
             } catch (Exception e) {
                 eventDeduplicationService.markFailed(eventKey);
                 System.err.println("Failed to release stock: " + e.getMessage());
             }
        }
    }
}
