package com.ecommerce.order.event;

public record InventoryFailedEvent(Long orderId, String reason) {}
