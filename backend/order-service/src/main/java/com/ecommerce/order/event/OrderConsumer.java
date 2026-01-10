package com.ecommerce.order.event;

import com.ecommerce.order.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
public class OrderConsumer {

    @Autowired
    private OrderService orderService;

    @KafkaListener(topics = "payment-success", groupId = "order-group")
    public void handlePaymentSuccess(PaymentSuccessEvent event) {
        System.out.println("Order Service received Payment Success: " + event.orderId());
        orderService.updateOrderStatus(event.orderId(), "PAID");
    }

    @KafkaListener(topics = "payment-failed", groupId = "order-group")
    public void handlePaymentFailed(PaymentFailedEvent event) {
        System.out.println("Order Service received Payment Failed: " + event.orderId());
        orderService.updateOrderStatus(event.orderId(), "CANCELLED");
    }

    @KafkaListener(topics = "inventory-failed", groupId = "order-group")
    public void handleInventoryFailed(InventoryFailedEvent event) {
        System.out.println("Order Service received Inventory Failed: " + event.orderId());
        orderService.updateOrderStatus(event.orderId(), "CANCELLED");
    }
}
