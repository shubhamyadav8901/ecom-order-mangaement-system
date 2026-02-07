package com.ecommerce.inventory.controller;

import com.ecommerce.common.exception.GlobalExceptionHandler;
import com.ecommerce.common.exception.InsufficientStockException;
import com.ecommerce.common.exception.InventoryNotFoundException;
import com.ecommerce.inventory.dto.ReservationRequest;
import com.ecommerce.inventory.dto.StockRequest;
import com.ecommerce.inventory.service.InventoryService;
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

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class InventoryControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private InventoryService inventoryService;

    @InjectMocks
    private InventoryController inventoryController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(inventoryController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void addStockSuccess() throws Exception {
        doNothing().when(inventoryService).addStock(any(StockRequest.class));

        mockMvc.perform(post("/inventory/add")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new StockRequest(1L, 10))))
                .andExpect(status().isOk());
    }

    @Test
    void setStockSuccess() throws Exception {
        doNothing().when(inventoryService).setStock(any(StockRequest.class));

        mockMvc.perform(post("/inventory/set")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new StockRequest(1L, 50))))
                .andExpect(status().isOk());
    }

    @Test
    void reserveStockSuccess() throws Exception {
        doNothing().when(inventoryService).reserveStock(any(ReservationRequest.class));

        mockMvc.perform(post("/inventory/reserve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ReservationRequest(100L, 1L, 2))))
                .andExpect(status().isOk());
    }

    @Test
    void reserveStockInsufficientStockReturnsConflict() throws Exception {
        doThrow(new InsufficientStockException(1L, 10, 1)).when(inventoryService)
                .reserveStock(any(ReservationRequest.class));

        mockMvc.perform(post("/inventory/reserve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ReservationRequest(100L, 1L, 10))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error").value("INSUFFICIENT_STOCK"));
    }

    @Test
    void reserveStockInventoryNotFoundReturnsNotFound() throws Exception {
        doThrow(new InventoryNotFoundException(999L)).when(inventoryService)
                .reserveStock(any(ReservationRequest.class));

        mockMvc.perform(post("/inventory/reserve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ReservationRequest(100L, 999L, 1))))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("INVENTORY_NOT_FOUND"));
    }

    @Test
    void confirmReservationSuccess() throws Exception {
        doNothing().when(inventoryService).confirmReservation(100L);

        mockMvc.perform(post("/inventory/confirm/100"))
                .andExpect(status().isOk());
    }

    @Test
    void releaseReservationSuccess() throws Exception {
        doNothing().when(inventoryService).releaseReservation(100L);

        mockMvc.perform(post("/inventory/release/100"))
                .andExpect(status().isOk());
    }

    @Test
    void getBatchStockSuccess() throws Exception {
        when(inventoryService.getBatchStock(any())).thenReturn(Map.of(1L, 100, 2L, 50));

        mockMvc.perform(post("/inventory/batch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[1,2]"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.1").value(100))
                .andExpect(jsonPath("$.2").value(50));
    }
}
