package com.ecommerce.product.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ProductResponse(
    Long id,
    String name,
    String description,
    BigDecimal price,
    Long categoryId,
    String categoryName,
    Long sellerId,
    String status,
    LocalDateTime createdAt,
    List<String> imageUrls
) {}
