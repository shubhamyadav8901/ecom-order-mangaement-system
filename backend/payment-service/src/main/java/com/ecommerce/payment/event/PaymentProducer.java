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
    private static final String TOPIC_REFUND_SUCCESS = "refund-success";
    private static final String TOPIC_REFUND_FAILED = "refund-failed";

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

    public void publishRefundSuccess(Long orderId, String transactionId) {
        RefundSuccessEvent event = new RefundSuccessEvent(orderId, transactionId);
        outboxService.enqueue(
                TOPIC_REFUND_SUCCESS,
                Objects.requireNonNull(orderId.toString()),
                TOPIC_REFUND_SUCCESS,
                event);
    }

    public void publishRefundFailed(Long orderId, String reason) {
        RefundFailedEvent event = new RefundFailedEvent(orderId, reason);
        outboxService.enqueue(
                TOPIC_REFUND_FAILED,
                Objects.requireNonNull(orderId.toString()),
                TOPIC_REFUND_FAILED,
                event);
    }
}
