package com.ecommerce.payment.service;

import com.ecommerce.payment.domain.Payment;
import com.ecommerce.payment.dto.PaymentRequest;
import com.ecommerce.payment.dto.PaymentResponse;
import com.ecommerce.payment.repository.PaymentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private PaymentService paymentService;

    @Test
    void initiatePaymentReturnsExistingCompletedPayment() {
        Payment existing = samplePayment(20L, "COMPLETED");
        existing.setId(99L);
        existing.setAmount(new BigDecimal("49.99"));
        existing.setPaymentMethod("CARD");

        when(paymentRepository.findByOrderId(20L)).thenReturn(Optional.of(existing));

        PaymentResponse response = paymentService.initiatePayment(new PaymentRequest(20L, new BigDecimal("49.99"), "CARD"));

        assertEquals(99L, response.id());
        assertEquals("COMPLETED", response.status());
    }

    @Test
    void initiatePaymentRetriesExistingFailedPayment() {
        Payment existing = samplePayment(21L, "FAILED");
        existing.setId(100L);
        existing.setTransactionId("old-transaction");
        existing.setAmount(new BigDecimal("10.00"));
        existing.setPaymentMethod("UPI");

        when(paymentRepository.findByOrderId(21L)).thenReturn(Optional.of(existing));
        when(paymentRepository.save(existing)).thenReturn(existing);

        PaymentResponse response = paymentService.initiatePayment(new PaymentRequest(21L, new BigDecimal("12.00"), "CARD"));

        assertEquals("COMPLETED", response.status());
        assertEquals(new BigDecimal("12.00"), response.amount());
        assertEquals("CARD", existing.getPaymentMethod());
        verify(paymentRepository).save(existing);
    }

    @Test
    void initiatePaymentCreatesNewPaymentWhenMissing() {
        Payment created = samplePayment(22L, "PENDING");
        created.setId(101L);
        created.setTransactionId("tx-22");
        created.setAmount(new BigDecimal("29.99"));

        Payment completed = samplePayment(22L, "COMPLETED");
        completed.setId(101L);
        completed.setTransactionId("tx-22");
        completed.setAmount(new BigDecimal("29.99"));

        when(paymentRepository.findByOrderId(22L)).thenReturn(Optional.empty());
        when(paymentRepository.save(any(Payment.class)))
                .thenReturn(created)
                .thenReturn(completed);

        PaymentResponse response = paymentService.initiatePayment(new PaymentRequest(22L, new BigDecimal("29.99"), "CARD"));

        assertEquals(101L, response.id());
        assertEquals("COMPLETED", response.status());
        verify(paymentRepository, times(2)).save(any(Payment.class));
    }

    @Test
    void refundPaymentCompletedMarksRefunded() {
        Payment payment = samplePayment(10L, "COMPLETED");
        when(paymentRepository.findByOrderId(10L)).thenReturn(Optional.of(payment));
        when(paymentRepository.save(payment)).thenReturn(payment);

        PaymentResponse response = paymentService.refundPayment(10L);

        assertEquals("REFUNDED", response.status());
        verify(paymentRepository).save(payment);
    }

    @Test
    void refundPaymentNonCompletedThrows() {
        Payment payment = samplePayment(11L, "PENDING");
        when(paymentRepository.findByOrderId(11L)).thenReturn(Optional.of(payment));

        assertThrows(RuntimeException.class, () -> paymentService.refundPayment(11L));
    }

    private Payment samplePayment(Long orderId, String status) {
        Payment payment = new Payment();
        payment.setOrderId(orderId);
        payment.setStatus(status);
        payment.setAmount(BigDecimal.ONE);
        payment.setTransactionId("tx-" + orderId);
        return payment;
    }
}
