package com.ecommerce.inventory.event;

public record OrderItemEvent(Long productId, Integer quantity) {}
