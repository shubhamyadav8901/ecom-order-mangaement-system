package com.ecommerce.order.event;

public record RefundSuccessEvent(Long orderId, String transactionId) {}
