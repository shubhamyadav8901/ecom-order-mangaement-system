package com.ecommerce.payment.event;

import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
public class PaymentProducer {

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    private static final String TOPIC_PAYMENT_SUCCESS = "payment-success";
    private static final String TOPIC_PAYMENT_FAILED = "payment-failed";

    public void publishPaymentSuccess(Long orderId, String transactionId) {
        PaymentSuccessEvent event = new PaymentSuccessEvent(orderId, transactionId);
        kafkaTemplate.send(TOPIC_PAYMENT_SUCCESS, Objects.requireNonNull(orderId.toString()), event);
    }

    public void publishPaymentFailed(Long orderId, String reason) {
        PaymentFailedEvent event = new PaymentFailedEvent(orderId, reason);
        kafkaTemplate.send(TOPIC_PAYMENT_FAILED, Objects.requireNonNull(orderId.toString()), event);
    }
}
