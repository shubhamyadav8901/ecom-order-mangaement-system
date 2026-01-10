package com.ecommerce.inventory.event;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import java.math.BigDecimal;

@Component
public class InventoryProducer {

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    private static final String TOPIC_INVENTORY_RESERVED = "inventory-reserved";
    private static final String TOPIC_INVENTORY_FAILED = "inventory-failed";

    public void publishInventoryReserved(Long orderId, BigDecimal totalAmount) {
        InventoryReservedEvent event = new InventoryReservedEvent(orderId, totalAmount);
        kafkaTemplate.send(TOPIC_INVENTORY_RESERVED, orderId.toString(), event);
    }

    public void publishInventoryFailed(Long orderId, String reason) {
        InventoryFailedEvent event = new InventoryFailedEvent(orderId, reason);
        kafkaTemplate.send(TOPIC_INVENTORY_FAILED, orderId.toString(), event);
    }
}
