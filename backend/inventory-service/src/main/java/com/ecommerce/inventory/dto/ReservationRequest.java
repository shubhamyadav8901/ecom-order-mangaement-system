package com.ecommerce.inventory.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ReservationRequest(
        @NotNull @Positive Long orderId,
        @NotNull @Positive Long productId,
        @NotNull @Positive Integer quantity) {
}
