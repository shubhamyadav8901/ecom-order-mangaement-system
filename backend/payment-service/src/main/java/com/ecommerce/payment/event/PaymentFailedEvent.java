package com.ecommerce.payment.event;

public record PaymentFailedEvent(Long orderId, String reason) {}
