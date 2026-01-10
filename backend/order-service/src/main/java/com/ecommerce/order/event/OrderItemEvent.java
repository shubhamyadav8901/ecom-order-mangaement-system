package com.ecommerce.order.event;

public record OrderItemEvent(Long productId, Integer quantity) {}
