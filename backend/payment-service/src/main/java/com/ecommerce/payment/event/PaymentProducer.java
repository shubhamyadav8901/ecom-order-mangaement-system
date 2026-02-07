package com.ecommerce.payment.event;

import com.ecommerce.payment.outbox.OutboxService;
import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class PaymentProducer {

    @Autowired
    private OutboxService outboxService;

    private static final String TOPIC_PAYMENT_SUCCESS = "payment-success";
    private static final String TOPIC_PAYMENT_FAILED = "payment-failed";

    public void publishPaymentSuccess(Long orderId, String transactionId) {
        PaymentSuccessEvent event = new PaymentSuccessEvent(orderId, transactionId);
        outboxService.enqueue(
                TOPIC_PAYMENT_SUCCESS,
                Objects.requireNonNull(orderId.toString()),
                TOPIC_PAYMENT_SUCCESS,
                event);
    }

    public void publishPaymentFailed(Long orderId, String reason) {
        PaymentFailedEvent event = new PaymentFailedEvent(orderId, reason);
        outboxService.enqueue(
                TOPIC_PAYMENT_FAILED,
                Objects.requireNonNull(orderId.toString()),
                TOPIC_PAYMENT_FAILED,
                event);
    }
}
