package com.ecommerce.payment.event;

import com.ecommerce.payment.dto.PaymentRequest;
import com.ecommerce.payment.dto.PaymentResponse;
import com.ecommerce.payment.service.EventDeduplicationService;
import com.ecommerce.payment.service.PaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class PaymentConsumer {
    private static final Logger logger = LoggerFactory.getLogger(PaymentConsumer.class);

    @Autowired
    private PaymentService paymentService;

    @Autowired
    private PaymentProducer paymentProducer;

    @Autowired
    private EventDeduplicationService eventDeduplicationService;

    @KafkaListener(topics = "inventory-reserved", groupId = "payment-group")
    public void handleInventoryReserved(InventoryReservedEvent event) {
        String eventKey = "inventory-reserved:" + event.orderId();
        if (!eventDeduplicationService.tryStartProcessing(eventKey)) {
            return;
        }
        logger.info("Payment service received inventory-reserved for order {}", event.orderId());

        try {
            PaymentResponse response = paymentService.initiatePayment(new PaymentRequest(event.orderId(), event.totalAmount(), "CREDIT_CARD"));

            if ("COMPLETED".equals(response.status())) {
                paymentProducer.publishPaymentSuccess(event.orderId(), response.transactionId());
            } else {
                paymentProducer.publishPaymentFailed(event.orderId(), "Payment status: " + response.status());
            }
        } catch (Exception e) {
            eventDeduplicationService.markFailed(eventKey);
            logger.error("Payment processing failed for order {}", event.orderId(), e);
            paymentProducer.publishPaymentFailed(event.orderId(), e.getMessage());
        }
    }

    @KafkaListener(topics = "refund-requested", groupId = "payment-group")
    public void handleRefundRequested(RefundRequestedEvent event) {
        String eventKey = "refund-requested:" + event.orderId();
        if (!eventDeduplicationService.tryStartProcessing(eventKey)) {
            return;
        }

        try {
            PaymentResponse response = paymentService.refundPayment(event.orderId());
            if ("REFUNDED".equals(response.status())) {
                paymentProducer.publishRefundSuccess(event.orderId(), response.transactionId());
            } else {
                paymentProducer.publishRefundFailed(event.orderId(), "Refund status: " + response.status());
            }
        } catch (Exception e) {
            eventDeduplicationService.markFailed(eventKey);
            logger.error("Refund processing failed for order {}", event.orderId(), e);
            paymentProducer.publishRefundFailed(event.orderId(), e.getMessage());
        }
    }
}
