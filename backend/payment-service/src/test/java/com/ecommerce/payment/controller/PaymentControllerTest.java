package com.ecommerce.payment.controller;

import com.ecommerce.common.exception.GlobalExceptionHandler;
import com.ecommerce.common.exception.OrderNotFoundException;
import com.ecommerce.payment.dto.PaymentRequest;
import com.ecommerce.payment.dto.PaymentResponse;
import com.ecommerce.payment.service.PaymentService;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class PaymentControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private PaymentService paymentService;

    @InjectMocks
    private PaymentController paymentController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(paymentController)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @Test
    void initiatePaymentSuccess() throws Exception {
        when(paymentService.initiatePayment(any(PaymentRequest.class))).thenReturn(
                new PaymentResponse(1L, 100L, "tx-123", new BigDecimal("49.99"), "COMPLETED", null)
        );

        mockMvc.perform(post("/payments/initiate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new PaymentRequest(100L, new BigDecimal("49.99"), "CARD"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1L))
                .andExpect(jsonPath("$.status").value("COMPLETED"));
    }

    @Test
    void initiatePaymentOrderNotFound() throws Exception {
        when(paymentService.initiatePayment(any(PaymentRequest.class))).thenThrow(new OrderNotFoundException(999L));

        mockMvc.perform(post("/payments/initiate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\":999,\"amount\":49.99,\"paymentMethod\":\"CARD\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error").value("ORDER_NOT_FOUND"));
    }

    @Test
    void initiatePaymentInvalidAmountReturnsBadRequest() throws Exception {
        mockMvc.perform(post("/payments/initiate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"orderId\":100,\"amount\":-1,\"paymentMethod\":\"CARD\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"));
    }
}
