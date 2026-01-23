package com.ecommerce.order.event;

public record PaymentSuccessEvent(Long orderId, String transactionId) {}
