package com.ecommerce.order.event;

public record RefundFailedEvent(Long orderId, String reason) {}
