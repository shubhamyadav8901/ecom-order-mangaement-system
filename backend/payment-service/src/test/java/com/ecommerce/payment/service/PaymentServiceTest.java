package com.ecommerce.payment.service;

import com.ecommerce.payment.domain.Payment;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private PaymentService paymentService;

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
