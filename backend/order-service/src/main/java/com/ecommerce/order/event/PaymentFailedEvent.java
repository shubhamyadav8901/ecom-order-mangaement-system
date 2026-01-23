package com.ecommerce.order.event;

public record PaymentFailedEvent(Long orderId, String reason) {}
