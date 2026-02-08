package com.ecommerce.payment.event;

public record RefundFailedEvent(Long orderId, String reason) {}
