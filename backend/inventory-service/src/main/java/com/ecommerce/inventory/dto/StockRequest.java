package com.ecommerce.inventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record StockRequest(@NotNull @Positive Long productId, @NotNull @PositiveOrZero Integer quantity) {
}
