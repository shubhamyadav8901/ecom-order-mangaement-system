package com.ecommerce.order.saga;

import com.ecommerce.order.client.ProductCatalogClient;
import com.ecommerce.order.domain.Order;
import com.ecommerce.order.dto.OrderItemRequest;
import com.ecommerce.order.dto.OrderRequest;
import com.ecommerce.order.event.InventoryFailedEvent;
import com.ecommerce.order.event.PaymentSuccessEvent;
import com.ecommerce.order.event.RefundSuccessEvent;
import com.ecommerce.order.outbox.OutboxEventRepository;
import com.ecommerce.order.repository.OrderRepository;
import com.ecommerce.order.service.OrderService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.kafka.KafkaContainer;
import org.testcontainers.utility.DockerImageName;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.List;
import java.util.Objects;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.fail;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.when;

@SpringBootTest(properties = "spring.task.scheduling.enabled=false")
@Testcontainers(disabledWithoutDocker = true)
@SuppressWarnings("null")
class OrderSagaFlowIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("order_saga_test_db")
            .withUsername("test")
            .withPassword("test");

    @Container
    static final KafkaContainer KAFKA = new KafkaContainer(
            DockerImageName.parse("apache/kafka-native:3.8.0"));

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.flyway.url", POSTGRES::getJdbcUrl);
        registry.add("spring.flyway.user", POSTGRES::getUsername);
        registry.add("spring.flyway.password", POSTGRES::getPassword);
        registry.add("spring.kafka.bootstrap-servers", KAFKA::getBootstrapServers);
    }

    @Autowired
    private OrderService orderService;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OutboxEventRepository outboxEventRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    @MockBean
    private ProductCatalogClient productCatalogClient;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("TRUNCATE TABLE order_items, orders, outbox_events, processed_events RESTART IDENTITY CASCADE");
        when(productCatalogClient.getProducts(anyList())).thenAnswer(invocation -> {
            List<Long> productIds = invocation.getArgument(0, List.class);
            return productIds.stream().collect(Collectors.toMap(
                    id -> id,
                    id -> new ProductCatalogClient.ProductInfo(id, new BigDecimal("99.99"), "ACTIVE")));
        });
    }

    @Test
    void createOrderThenPaymentSuccessMarksOrderPaid() throws Exception {
        Long orderId = createOrder(1001L, 2);

        kafkaTemplate.send("payment-success", String.valueOf(orderId), new PaymentSuccessEvent(orderId, "txn-1001"))
                .get(10, TimeUnit.SECONDS);

        awaitOrderStatus(orderId, "PAID", Duration.ofSeconds(10));
    }

    @Test
    void inventoryFailureCancelsCreatedOrder() throws Exception {
        Long orderId = createOrder(1002L, 1);

        kafkaTemplate.send("inventory-failed", String.valueOf(orderId), new InventoryFailedEvent(orderId, "stock unavailable"))
                .get(10, TimeUnit.SECONDS);

        awaitOrderStatus(orderId, "CANCELLED", Duration.ofSeconds(10));
    }

    @Test
    void paidOrderCancellationTriggersRefundFlowAndCompletesOnRefundSuccess() throws Exception {
        Long orderId = createOrder(1003L, 1);
        kafkaTemplate.send("payment-success", String.valueOf(orderId), new PaymentSuccessEvent(orderId, "txn-1003"))
                .get(10, TimeUnit.SECONDS);
        awaitOrderStatus(orderId, "PAID", Duration.ofSeconds(10));

        orderService.cancelOrder(orderId, 1003L, false);
        awaitOrderStatus(orderId, "REFUND_PENDING", Duration.ofSeconds(2));

        long orderCancelledEvents = outboxEventRepository.findAll().stream()
                .filter(event -> "order-cancelled".equals(event.getTopic()))
                .filter(event -> Objects.equals(event.getAggregateKey(), String.valueOf(orderId)))
                .count();
        long refundRequestedEvents = outboxEventRepository.findAll().stream()
                .filter(event -> "refund-requested".equals(event.getTopic()))
                .filter(event -> Objects.equals(event.getAggregateKey(), String.valueOf(orderId)))
                .count();
        assertEquals(1L, orderCancelledEvents);
        assertEquals(1L, refundRequestedEvents);

        kafkaTemplate.send("refund-success", String.valueOf(orderId), new RefundSuccessEvent(orderId, "refund-1003"))
                .get(10, TimeUnit.SECONDS);

        awaitOrderStatus(orderId, "CANCELLED", Duration.ofSeconds(10));
    }

    @Test
    void duplicatePaymentSuccessEventIsProcessedOnce() throws Exception {
        Long orderId = createOrder(1004L, 1);
        PaymentSuccessEvent event = new PaymentSuccessEvent(orderId, "txn-1004");

        kafkaTemplate.send("payment-success", String.valueOf(orderId), event).get(10, TimeUnit.SECONDS);
        kafkaTemplate.send("payment-success", String.valueOf(orderId), event).get(10, TimeUnit.SECONDS);

        awaitOrderStatus(orderId, "PAID", Duration.ofSeconds(10));

        Integer processedRows = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM processed_events WHERE event_key = ?",
                Integer.class,
                "payment-success:" + orderId);
        assertEquals(1, processedRows);
    }

    private Long createOrder(Long userId, int quantity) {
        OrderRequest request = new OrderRequest(List.of(
                new OrderItemRequest(1L, quantity, BigDecimal.ZERO)
        ));
        return orderService.createOrder(userId, request).id();
    }

    private void awaitOrderStatus(Long orderId, String expectedStatus, Duration timeout) throws InterruptedException {
        long deadline = System.currentTimeMillis() + timeout.toMillis();
        while (System.currentTimeMillis() < deadline) {
            Order order = orderRepository.findById(orderId).orElse(null);
            if (order != null && expectedStatus.equals(order.getStatus())) {
                return;
            }
            Thread.sleep(100);
        }
        Order latest = orderRepository.findById(orderId).orElse(null);
        String actualStatus = latest == null ? "<missing>" : latest.getStatus();
        fail("Timed out waiting for order " + orderId + " status " + expectedStatus + ", actual " + actualStatus);
    }
}
