package com.ecommerce.order.dto;

import java.math.BigDecimal;

public record OrderItemRequest(Long productId, Integer quantity, BigDecimal price) {}
