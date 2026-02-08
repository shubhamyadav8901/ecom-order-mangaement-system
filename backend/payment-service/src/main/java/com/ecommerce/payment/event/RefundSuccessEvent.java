package com.ecommerce.payment.event;

public record RefundSuccessEvent(Long orderId, String transactionId) {}
