package com.ecommerce.order.dto;

import java.math.BigDecimal;
import java.util.List;

public record OrderRequest(List<OrderItemRequest> items) {}
