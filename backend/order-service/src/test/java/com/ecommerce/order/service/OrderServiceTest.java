package com.ecommerce.order.service;

import com.ecommerce.order.domain.Order;
import com.ecommerce.order.event.OrderCancelledEvent;
import com.ecommerce.order.event.RefundRequestedEvent;
import com.ecommerce.order.outbox.OutboxService;
import com.ecommerce.order.repository.OrderRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OutboxService outboxService;

    @InjectMocks
    private OrderService orderService;

    @Test
    void cancelOrderPaidMarksRefundPendingAndEmitsRefundRequest() {
        Order order = sampleOrder(10L, 20L, "PAID");
        when(orderRepository.findById(10L)).thenReturn(Optional.of(order));

        orderService.cancelOrder(10L, 20L, false);

        verify(orderRepository).save(order);
        verify(outboxService).enqueue(eq("order-cancelled"), eq("10"), eq("order-cancelled"), any(OrderCancelledEvent.class));
        verify(outboxService).enqueue(eq("refund-requested"), eq("10"), eq("refund-requested"), any(RefundRequestedEvent.class));
    }

    @Test
    void cancelOrderUnpaidCancelsAndDoesNotEmitRefundRequest() {
        Order order = sampleOrder(11L, 21L, "CREATED");
        when(orderRepository.findById(11L)).thenReturn(Optional.of(order));

        orderService.cancelOrder(11L, 21L, false);

        verify(orderRepository).save(order);
        verify(outboxService).enqueue(eq("order-cancelled"), eq("11"), eq("order-cancelled"), any(OrderCancelledEvent.class));
        verify(outboxService, never()).enqueue(eq("refund-requested"), eq("11"), eq("refund-requested"), any(RefundRequestedEvent.class));
    }

    private Order sampleOrder(Long orderId, Long userId, String status) {
        Order order = new Order();
        order.setId(orderId);
        order.setUserId(userId);
        order.setStatus(status);
        order.setTotalAmount(BigDecimal.TEN);
        return order;
    }
}
