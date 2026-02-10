package com.ecommerce.order.client;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface ProductCatalogClient {
    ProductInfo getProduct(Long productId);
    Map<Long, ProductInfo> getProducts(List<Long> productIds);

    record ProductInfo(Long id, BigDecimal price, String status) {}
}
