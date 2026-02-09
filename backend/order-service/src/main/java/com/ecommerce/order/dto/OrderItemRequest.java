package com.ecommerce.order.dto;

import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.math.BigDecimal;

public record OrderItemRequest(@Positive Long productId, @Positive Integer quantity, @PositiveOrZero BigDecimal price) {
}
