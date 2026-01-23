package com.ecommerce.order.event;

import org.springframework.lang.NonNull;

public record PaymentSuccessEvent(@NonNull Long orderId, String transactionId) {}
