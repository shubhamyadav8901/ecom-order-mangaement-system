package com.ecommerce.payment.event;

public record PaymentSuccessEvent(Long orderId, String transactionId) {}
