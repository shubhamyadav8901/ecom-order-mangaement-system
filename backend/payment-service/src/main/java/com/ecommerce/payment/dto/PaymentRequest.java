package com.ecommerce.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

public record PaymentRequest(
        @NotNull @Positive Long orderId,
        @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
        @NotBlank String paymentMethod) {
}
