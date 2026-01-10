package com.ecommerce.product.dto;

import java.util.List;

public record CategoryResponse(Long id, String name, String description, Long parentId, List<CategoryResponse> subCategories) {}
