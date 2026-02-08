package com.ecommerce.payment.service;

import com.ecommerce.payment.domain.Payment;
import com.ecommerce.payment.dto.PaymentRequest;
import com.ecommerce.payment.dto.PaymentResponse;
import com.ecommerce.payment.repository.PaymentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Objects;
import java.util.UUID;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Transactional
    public PaymentResponse initiatePayment(PaymentRequest request) {
        // Idempotency check could go here

        Payment payment = Objects.requireNonNull(
                Payment.builder()
                        .orderId(request.orderId())
                        .amount(request.amount())
                        .paymentMethod(request.paymentMethod())
                        .status("PENDING")
                        .transactionId(UUID.randomUUID().toString()) // Simulate Gateway ID
                        .build());

        Payment savedPayment = paymentRepository.save(payment);

        // In a real flow, we might wait for webhook or process async.
        // For simulation, let's auto-complete it successfully.
        savedPayment.setStatus("COMPLETED");
        savedPayment = paymentRepository.save(savedPayment);

        return mapToResponse(savedPayment);
    }

    @Transactional
    public PaymentResponse refundPayment(Long orderId) {
        Payment payment = paymentRepository.findByOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Payment not found for order: " + orderId));

        if ("REFUNDED".equals(payment.getStatus())) {
            return mapToResponse(payment);
        }

        if (!"COMPLETED".equals(payment.getStatus())) {
            throw new RuntimeException("Payment is not refundable in status: " + payment.getStatus());
        }

        payment.setStatus("REFUNDED");
        return mapToResponse(paymentRepository.save(payment));
    }

    private PaymentResponse mapToResponse(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getOrderId(),
                payment.getTransactionId(),
                payment.getAmount(),
                payment.getStatus(),
                payment.getCreatedAt());
    }
}
