package com.ecommerce.order.controller;

import com.ecommerce.order.dto.OrderRequest;
import com.ecommerce.order.dto.OrderResponse;
import com.ecommerce.common.security.CustomPrincipal;
import com.ecommerce.order.service.OrderService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")
@SuppressWarnings("null")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(Authentication authentication, @Valid @RequestBody OrderRequest request) {
        Long userId = getUserIdFromAuthentication(authentication);
        return ResponseEntity.ok(orderService.createOrder(userId, request));
    }

    private Long getUserIdFromAuthentication(Authentication authentication) {
        if (authentication.getPrincipal() instanceof CustomPrincipal) {
            return ((CustomPrincipal) authentication.getPrincipal()).getUserId();
        }
        throw new BadCredentialsException("Invalid user principal");
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(Authentication authentication, @PathVariable @NonNull Long id) {
        if (isAdmin(authentication)) {
            return ResponseEntity.ok(orderService.getOrderById(id));
        }
        Long userId = getUserIdFromAuthentication(authentication);
        return ResponseEntity.ok(orderService.getOrderByIdForUser(id, userId));
    }

    @GetMapping
    public ResponseEntity<List<OrderResponse>> getAllOrders(Authentication authentication) {
        ensureAdmin(authentication);
        return ResponseEntity.ok(orderService.getAllOrders());
    }

    @GetMapping("/my-orders")
    public ResponseEntity<List<OrderResponse>> getMyOrders(Authentication authentication) {
        Long userId = getUserIdFromAuthentication(authentication);
        return ResponseEntity.ok(orderService.getUserOrders(userId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<OrderResponse>> getUserOrders(Authentication authentication, @PathVariable Long userId) {
        ensureAdmin(authentication);
        return ResponseEntity.ok(orderService.getUserOrders(userId));
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<Void> cancelOrder(Authentication authentication, @NonNull @PathVariable Long id) {
        boolean admin = isAdmin(authentication);
        Long userId = admin ? null : getUserIdFromAuthentication(authentication);
        orderService.cancelOrder(id, userId, admin);
        return ResponseEntity.ok().build();
    }

    private boolean isAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch("ROLE_ADMIN"::equals);
    }

    private void ensureAdmin(Authentication authentication) {
        if (!isAdmin(authentication)) {
            throw new AccessDeniedException("Admin access required");
        }
    }
}
