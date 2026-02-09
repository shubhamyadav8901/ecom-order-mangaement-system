package com.ecommerce.order.controller;

import com.ecommerce.common.exception.GlobalExceptionHandler;
import com.ecommerce.common.exception.OrderNotFoundException;
import com.ecommerce.common.security.CustomPrincipal;
import com.ecommerce.order.dto.OrderItemRequest;
import com.ecommerce.order.dto.OrderItemResponse;
import com.ecommerce.order.dto.OrderRequest;
import com.ecommerce.order.dto.OrderResponse;
import com.ecommerce.order.service.OrderService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class OrderControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private OrderService orderService;

    @InjectMocks
    private OrderController orderController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(orderController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void createOrderSuccess() throws Exception {
        when(orderService.createOrder(anyLong(), any(OrderRequest.class))).thenReturn(sampleOrderResponse(1L, 10L));

        mockMvc.perform(post("/orders")
                        .principal(customerAuth(10L))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new OrderRequest(List.of(new OrderItemRequest(5L, 2, new BigDecimal("19.99")))))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.status").value("CREATED"));
    }

    @Test
    void createOrderInvalidPrincipalReturnsUnauthorized() throws Exception {
        mockMvc.perform(post("/orders")
                        .principal(new UsernamePasswordAuthenticationToken("plain-user", null, List.of()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new OrderRequest(List.of(new OrderItemRequest(5L, 1, new BigDecimal("19.99")))))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid user principal"));
    }

    @Test
    void getOrderByIdAsOwnerSuccess() throws Exception {
        when(orderService.getOrderByIdForUser(1L, 10L)).thenReturn(sampleOrderResponse(1L, 10L));

        mockMvc.perform(get("/orders/1").principal(customerAuth(10L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    void getOrderByIdAsAdminSuccess() throws Exception {
        when(orderService.getOrderById(1L)).thenReturn(sampleOrderResponse(1L, 99L));

        mockMvc.perform(get("/orders/1").principal(adminAuth(1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    void getOrderByIdNotFound() throws Exception {
        when(orderService.getOrderByIdForUser(404L, 10L)).thenThrow(new OrderNotFoundException(404L));

        mockMvc.perform(get("/orders/404").principal(customerAuth(10L)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("ORDER_NOT_FOUND"));
    }

    @Test
    void getAllOrdersAdminSuccess() throws Exception {
        when(orderService.getAllOrders()).thenReturn(List.of(sampleOrderResponse(1L, 10L)));

        mockMvc.perform(get("/orders").principal(adminAuth(1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L));
    }

    @Test
    void getAllOrdersNonAdminForbidden() throws Exception {
        mockMvc.perform(get("/orders").principal(customerAuth(10L)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Admin access required"));
    }

    @Test
    void getMyOrdersSuccess() throws Exception {
        when(orderService.getUserOrders(10L)).thenReturn(List.of(sampleOrderResponse(1L, 10L)));

        mockMvc.perform(get("/orders/my-orders").principal(customerAuth(10L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].userId").value(10L));
    }

    @Test
    void getUserOrdersAdminSuccess() throws Exception {
        when(orderService.getUserOrders(10L)).thenReturn(List.of(sampleOrderResponse(1L, 10L)));

        mockMvc.perform(get("/orders/user/10").principal(adminAuth(1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L));
    }

    @Test
    void getUserOrdersNonAdminForbidden() throws Exception {
        mockMvc.perform(get("/orders/user/10").principal(customerAuth(10L)))
                .andExpect(status().isForbidden());
    }

    @Test
    void cancelOrderSuccess() throws Exception {
        doNothing().when(orderService).cancelOrder(anyLong(), any(), anyBoolean());

        mockMvc.perform(post("/orders/1/cancel").principal(customerAuth(10L)))
                .andExpect(status().isOk());
    }

    @Test
    void cancelOrderForbidden() throws Exception {
        doThrow(new AccessDeniedException("You are not allowed to cancel this order"))
                .when(orderService).cancelOrder(anyLong(), any(), anyBoolean());

        mockMvc.perform(post("/orders/1/cancel").principal(customerAuth(10L)))
                .andExpect(status().isForbidden());
    }

    private UsernamePasswordAuthenticationToken customerAuth(Long userId) {
        CustomPrincipal principal = new CustomPrincipal(
                "customer@example.com",
                "",
                List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")),
                userId);
        return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    private UsernamePasswordAuthenticationToken adminAuth(Long userId) {
        CustomPrincipal principal = new CustomPrincipal(
                "admin@example.com",
                "",
                List.of(new SimpleGrantedAuthority("ROLE_ADMIN")),
                userId);
        return new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
    }

    private OrderResponse sampleOrderResponse(Long orderId, Long userId) {
        return new OrderResponse(
                orderId,
                userId,
                "CREATED",
                new BigDecimal("39.98"),
                List.of(new OrderItemResponse(5L, 2, new BigDecimal("19.99"))),
                null);
    }
}
