package com.ecommerce.product.controller;

import com.ecommerce.common.exception.GlobalExceptionHandler;
import com.ecommerce.common.exception.ResourceNotFoundException;
import com.ecommerce.product.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Objects;

public class ProductControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ProductService productService;

    @InjectMocks
    private ProductController productController;

    @BeforeEach
    public void setup() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(productController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    public void testGetProductById_NotFound() throws Exception {
        when(productService.getProductById(1L)).thenThrow(new ResourceNotFoundException("Product not found"));

        mockMvc.perform(get("/products/1")
                .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON)))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testGetAllProducts_InternalServerError() throws Exception {
        when(productService.getAllProducts()).thenThrow(new RuntimeException("Database error"));

        mockMvc.perform(get("/products")
                .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON)))
                .andExpect(status().isInternalServerError());
    }
}
