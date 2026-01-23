package com.ecommerce.order.event;

import org.springframework.lang.NonNull;

public record PaymentFailedEvent(@NonNull Long orderId, String reason) {}
