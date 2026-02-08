package com.ecommerce.product.dto;

import java.math.BigDecimal;
import java.util.List;

public record ProductRequest(
    String name,
    String description,
    BigDecimal price,
    Long categoryId,
    Long sellerId,
    String status,
    List<String> imageUrls
) {}
