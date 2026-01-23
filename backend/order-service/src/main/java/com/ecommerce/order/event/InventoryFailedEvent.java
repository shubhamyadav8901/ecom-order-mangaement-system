package com.ecommerce.order.event;

import org.springframework.lang.NonNull;

public record InventoryFailedEvent(@NonNull Long orderId, String reason) {}
