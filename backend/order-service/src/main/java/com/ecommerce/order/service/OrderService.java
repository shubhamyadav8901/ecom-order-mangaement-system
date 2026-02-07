package com.ecommerce.order.service;

import com.ecommerce.common.exception.ResourceConflictException;
import com.ecommerce.common.exception.OrderNotFoundException;
import com.ecommerce.order.client.ProductCatalogClient;
import com.ecommerce.order.domain.Order;
import com.ecommerce.order.domain.OrderItem;
import com.ecommerce.order.dto.OrderRequest;
import com.ecommerce.order.dto.OrderResponse;
import com.ecommerce.order.event.OrderCancelledEvent;
import com.ecommerce.order.event.OrderCreatedEvent;
import com.ecommerce.order.event.OrderItemEvent;
import com.ecommerce.order.outbox.OutboxService;
import com.ecommerce.order.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class OrderService {

        @Autowired
        private OrderRepository orderRepository;

        @Autowired
        private ProductCatalogClient productCatalogClient;

        @Autowired
        private OutboxService outboxService;

        private static final String TOPIC_ORDER_CREATED = "order-created";
        private static final String TOPIC_ORDER_CANCELLED = "order-cancelled";

        @Transactional
        public OrderResponse createOrder(Long userId, OrderRequest request) {
                Order order = new Order();
                order.setUserId(userId);
                order.setStatus("CREATED");

                Map<Long, ProductCatalogClient.ProductInfo> productCache = new HashMap<>();
                List<OrderItem> items = request.items().stream()
                                .map(itemReq -> {
                                        ProductCatalogClient.ProductInfo product = productCache.computeIfAbsent(
                                                        itemReq.productId(),
                                                        productCatalogClient::getProduct);

                                        if (!"ACTIVE".equalsIgnoreCase(product.status())) {
                                                throw new ResourceConflictException(
                                                                "Product is not available for ordering: " + product.id());
                                        }

                                        return OrderItem.builder()
                                                        .order(order)
                                                        .productId(itemReq.productId())
                                                        .quantity(itemReq.quantity())
                                                        .price(product.price())
                                                        .build();
                                })
                                .collect(Collectors.toList());

                order.setItems(items);

                BigDecimal total = items.stream()
                                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                                .reduce(BigDecimal.ZERO, BigDecimal::add);

                order.setTotalAmount(total);

                Order savedOrder = orderRepository.save(order);

                // Publish Event
                List<OrderItemEvent> itemEvents = items.stream()
                                .map(i -> new OrderItemEvent(i.getProductId(), i.getQuantity()))
                                .collect(Collectors.toList());

                OrderCreatedEvent event = new OrderCreatedEvent(savedOrder.getId(), userId, total, itemEvents);
                outboxService.enqueue(
                                TOPIC_ORDER_CREATED,
                                Objects.requireNonNull(savedOrder.getId().toString()),
                                TOPIC_ORDER_CREATED,
                                event);

                return mapToResponse(savedOrder);
        }

        @Transactional(readOnly = true)
        public OrderResponse getOrderById(@NonNull Long id) {
                Order order = orderRepository.findById(id)
                                .orElseThrow(() -> new OrderNotFoundException(id));
                return mapToResponse(order);
        }

        @Transactional(readOnly = true)
        public OrderResponse getOrderByIdForUser(@NonNull Long id, @NonNull Long userId) {
                Order order = orderRepository.findByIdAndUserId(id, userId)
                                .orElseThrow(() -> new OrderNotFoundException(id));
                return mapToResponse(order);
        }

        @Transactional(readOnly = true)
        public List<OrderResponse> getAllOrders() {
                return orderRepository.findAll().stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public List<OrderResponse> getUserOrders(Long userId) {
                return orderRepository.findByUserId(userId).stream()
                                .map(this::mapToResponse)
                                .collect(Collectors.toList());
        }

        @Transactional
        public void updateOrderStatus(@NonNull Long orderId, String status) {
                Order order = orderRepository.findById(orderId)
                                .orElseThrow(() -> new RuntimeException("Order not found"));
                order.setStatus(status);
                orderRepository.save(order);
        }

        @Transactional
        public void cancelOrder(@NonNull Long orderId, Long requesterUserId, boolean isAdmin) {
                Order order = orderRepository.findById(orderId)
                        .orElseThrow(() -> new OrderNotFoundException(orderId));

                if (!isAdmin && (requesterUserId == null || !requesterUserId.equals(order.getUserId()))) {
                        throw new AccessDeniedException("You are not allowed to cancel this order");
                }

                if ("CANCELLED".equals(order.getStatus())) {
                        throw new RuntimeException("Order is already cancelled");
                }

                if ("DELIVERED".equals(order.getStatus())) {
                     throw new RuntimeException("Cannot cancel delivered order");
                }

                order.setStatus("CANCELLED");
                orderRepository.save(order);

                // Publish Event to release stock
                OrderCancelledEvent event = new OrderCancelledEvent(orderId);
                outboxService.enqueue(
                                TOPIC_ORDER_CANCELLED,
                                Objects.requireNonNull(String.valueOf(orderId)),
                                TOPIC_ORDER_CANCELLED,
                                event);
        }

        private OrderResponse mapToResponse(Order order) {
                return new OrderResponse(
                                order.getId(),
                                order.getUserId(),
                                order.getStatus(),
                                order.getTotalAmount(),
                                order.getItems().stream()
                                                .map(i -> new com.ecommerce.order.dto.OrderItemResponse(
                                                                i.getProductId(), i.getQuantity(), i.getPrice()))
                                                .collect(Collectors.toList()),
                                order.getCreatedAt());
        }
}
