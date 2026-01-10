package com.ecommerce.inventory.event;

import java.math.BigDecimal;

public record InventoryReservedEvent(Long orderId, BigDecimal totalAmount) {}
