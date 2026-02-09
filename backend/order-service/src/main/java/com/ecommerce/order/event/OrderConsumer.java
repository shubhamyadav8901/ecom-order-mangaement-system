package com.ecommerce.order.event;

import com.ecommerce.order.service.OrderService;
import com.ecommerce.order.service.EventDeduplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class OrderConsumer {

    @Autowired
    private OrderService orderService;

    @Autowired
    private EventDeduplicationService eventDeduplicationService;

    @KafkaListener(topics = "payment-success", groupId = "order-group")
    public void handlePaymentSuccess(PaymentSuccessEvent event) {
        String eventKey = "payment-success:" + event.orderId();
        if (!eventDeduplicationService.tryStartProcessing(eventKey)) {
            return;
        }
        try {
            System.out.println("Order Service received Payment Success: " + event.orderId());
            orderService.markPaid(event.orderId());
        } catch (RuntimeException ex) {
            eventDeduplicationService.markFailed(eventKey);
            throw ex;
        }
    }

    @KafkaListener(topics = "payment-failed", groupId = "order-group")
    public void handlePaymentFailed(PaymentFailedEvent event) {
        String eventKey = "payment-failed:" + event.orderId();
        if (!eventDeduplicationService.tryStartProcessing(eventKey)) {
            return;
        }
        try {
            System.out.println("Order Service received Payment Failed: " + event.orderId());
            orderService.cancelAfterPaymentFailure(event.orderId());
        } catch (RuntimeException ex) {
            eventDeduplicationService.markFailed(eventKey);
            throw ex;
        }
    }

    @KafkaListener(topics = "inventory-failed", groupId = "order-group")
    public void handleInventoryFailed(InventoryFailedEvent event) {
        String eventKey = "inventory-failed:" + event.orderId();
        if (!eventDeduplicationService.tryStartProcessing(eventKey)) {
            return;
        }
        try {
            System.out.println("Order Service received Inventory Failed: " + event.orderId());
            orderService.cancelAfterInventoryFailure(event.orderId());
        } catch (RuntimeException ex) {
            eventDeduplicationService.markFailed(eventKey);
            throw ex;
        }
    }

    @KafkaListener(topics = "refund-success", groupId = "order-group")
    public void handleRefundSuccess(RefundSuccessEvent event) {
        String eventKey = "refund-success:" + event.orderId();
        if (!eventDeduplicationService.tryStartProcessing(eventKey)) {
            return;
        }
        try {
            orderService.markRefundCompleted(event.orderId());
        } catch (RuntimeException ex) {
            eventDeduplicationService.markFailed(eventKey);
            throw ex;
        }
    }

    @KafkaListener(topics = "refund-failed", groupId = "order-group")
    public void handleRefundFailed(RefundFailedEvent event) {
        String eventKey = "refund-failed:" + event.orderId();
        if (!eventDeduplicationService.tryStartProcessing(eventKey)) {
            return;
        }
        try {
            orderService.markRefundFailed(event.orderId());
        } catch (RuntimeException ex) {
            eventDeduplicationService.markFailed(eventKey);
            throw ex;
        }
    }
}
