package com.ecommerce.order.dto;

import java.util.List;

public record OrderRequest(List<OrderItemRequest> items) {}
