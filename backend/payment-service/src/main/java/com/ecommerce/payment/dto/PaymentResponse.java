package com.ecommerce.payment.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
    Long id,
    Long orderId,
    String transactionId,
    BigDecimal amount,
    String status,
    LocalDateTime createdAt
) {}
