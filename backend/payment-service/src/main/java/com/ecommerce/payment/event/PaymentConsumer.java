package com.ecommerce.payment.event;

import com.ecommerce.payment.dto.PaymentRequest;
import com.ecommerce.payment.dto.PaymentResponse;
import com.ecommerce.payment.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class PaymentConsumer {

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private PaymentProducer paymentProducer;

    @KafkaListener(topics = "inventory-reserved", groupId = "payment-group")
    public void handleInventoryReserved(InventoryReservedEvent event) {
        System.out.println("Payment Service received Inventory Reserved: " + event.orderId());

        try {
            PaymentResponse response = paymentService.initiatePayment(new PaymentRequest(event.orderId(), event.totalAmount(), "CREDIT_CARD"));

            if ("COMPLETED".equals(response.status())) {
                paymentProducer.publishPaymentSuccess(event.orderId(), response.transactionId());
            } else {
                paymentProducer.publishPaymentFailed(event.orderId(), "Payment status: " + response.status());
            }
        } catch (Exception e) {
            System.err.println("Payment processing failed: " + e.getMessage());
            paymentProducer.publishPaymentFailed(event.orderId(), e.getMessage());
        }
    }
}
