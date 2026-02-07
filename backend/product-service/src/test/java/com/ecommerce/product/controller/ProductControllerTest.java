package com.ecommerce.product.controller;

import com.ecommerce.common.exception.GlobalExceptionHandler;
import com.ecommerce.common.exception.ResourceNotFoundException;
import com.ecommerce.product.dto.ProductRequest;
import com.ecommerce.product.dto.ProductResponse;
import com.ecommerce.product.service.ProductService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ProductControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private ProductService productService;

    @InjectMocks
    private ProductController productController;

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders.standaloneSetup(productController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void createProductSuccess() throws Exception {
        ProductRequest req = new ProductRequest("Phone", "Smartphone", new BigDecimal("499.99"), 1L, 10L, "ACTIVE");
        ProductResponse resp = new ProductResponse(101L, "Phone", "Smartphone", new BigDecimal("499.99"),
                1L, "Electronics", 10L, "ACTIVE", null);

        when(productService.createProduct(any(ProductRequest.class))).thenReturn(resp);

        mockMvc.perform(post("/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(101L))
                .andExpect(jsonPath("$.name").value("Phone"));
    }

    @Test
    void createProductInvalidCategoryReturnsNotFound() throws Exception {
        when(productService.createProduct(any(ProductRequest.class)))
                .thenThrow(new ResourceNotFoundException("Category not found with id: 999"));

        mockMvc.perform(post("/products")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Phone\",\"price\":499.99,\"categoryId\":999}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getAllProductsSuccess() throws Exception {
        when(productService.getAllProducts()).thenReturn(List.of(
                new ProductResponse(1L, "P1", "D1", new BigDecimal("10.00"), null, null, 1L, "ACTIVE", null),
                new ProductResponse(2L, "P2", "D2", new BigDecimal("20.00"), null, null, 1L, "ACTIVE", null)
        ));

        mockMvc.perform(get("/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1L))
                .andExpect(jsonPath("$[1].id").value(2L));
    }

    @Test
    void getAllProductsInternalServerError() throws Exception {
        when(productService.getAllProducts()).thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/products"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("An unexpected error occurred"));
    }

    @Test
    void getProductByIdSuccess() throws Exception {
        when(productService.getProductById(1L)).thenReturn(
                new ProductResponse(1L, "P1", "D1", new BigDecimal("10.00"), 2L, "Cat", 1L, "ACTIVE", null)
        );

        mockMvc.perform(get("/products/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L));
    }

    @Test
    void getProductByIdNotFound() throws Exception {
        when(productService.getProductById(1L)).thenThrow(new ResourceNotFoundException("Product not found"));

        mockMvc.perform(get("/products/1"))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateProductSuccess() throws Exception {
        ProductRequest req = new ProductRequest("Phone Updated", "Updated", new BigDecimal("599.99"), 1L, 10L, "ACTIVE");
        when(productService.updateProduct(any(Long.class), any(ProductRequest.class))).thenReturn(
                new ProductResponse(1L, "Phone Updated", "Updated", new BigDecimal("599.99"),
                        1L, "Electronics", 10L, "ACTIVE", null)
        );

        mockMvc.perform(put("/products/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Phone Updated"));
    }

    @Test
    void updateProductNotFound() throws Exception {
        when(productService.updateProduct(any(Long.class), any(ProductRequest.class)))
                .thenThrow(new ResourceNotFoundException("Product not found with id: 1"));

        mockMvc.perform(put("/products/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"X\",\"price\":1}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void deleteProductSuccess() throws Exception {
        doNothing().when(productService).deleteProduct(1L);

        mockMvc.perform(delete("/products/1"))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteProductServerError() throws Exception {
        doThrow(new RuntimeException("Delete failed")).when(productService).deleteProduct(1L);

        mockMvc.perform(delete("/products/1"))
                .andExpect(status().isInternalServerError());
    }
}
