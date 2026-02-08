package com.ecommerce.inventory.event;

import com.ecommerce.inventory.service.InventoryService;
import com.ecommerce.inventory.service.EventDeduplicationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class InventoryConsumer {
    private static final Logger logger = LoggerFactory.getLogger(InventoryConsumer.class);

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

    @KafkaListener(topics = {"payment-failed", "inventory-failed", "order-cancelled"}, groupId = "inventory-group")
    public void handleCompensation(org.apache.kafka.clients.consumer.ConsumerRecord<String, Object> record) {
        Long orderId = extractOrderId(record);
        if (orderId == null) {
            logger.warn("Skipping compensation event with missing/invalid order id on topic {}", record.topic());
            return;
        }

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

    private Long extractOrderId(org.apache.kafka.clients.consumer.ConsumerRecord<String, Object> record) {
        String orderIdStr = record.key();
        if (orderIdStr != null) {
            try {
                return Long.valueOf(orderIdStr);
            } catch (NumberFormatException ex) {
                logger.warn("Invalid order id key {} on topic {}", orderIdStr, record.topic());
            }
        }

        if (record.value() instanceof OrderCancelledEvent event) {
            return event.getOrderId();
        }
        return null;
    }
}
