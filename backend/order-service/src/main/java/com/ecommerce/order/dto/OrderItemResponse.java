package com.ecommerce.order.dto;

import java.math.BigDecimal;

public record OrderItemResponse(Long productId, Integer quantity, BigDecimal price) {}
