package com.ecommerce.inventory.dto;

public record ReservationRequest(Long orderId, Long productId, Integer quantity) {}
