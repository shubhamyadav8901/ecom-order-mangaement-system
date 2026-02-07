package com.ecommerce.order.client;

import java.math.BigDecimal;

public interface ProductCatalogClient {
    ProductInfo getProduct(Long productId);

    record ProductInfo(Long id, BigDecimal price, String status) {}
}
