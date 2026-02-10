package com.ecommerce.payment.saga;

import com.ecommerce.payment.domain.Payment;
import com.ecommerce.payment.event.InventoryReservedEvent;
import com.ecommerce.payment.event.RefundRequestedEvent;
import com.ecommerce.payment.outbox.OutboxEventRepository;
import com.ecommerce.payment.repository.PaymentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
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
import java.util.Objects;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.fail;

@SpringBootTest(properties = "spring.task.scheduling.enabled=false")
@Testcontainers(disabledWithoutDocker = true)
@SuppressWarnings("null")
class PaymentSagaFlowIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("payment_saga_test_db")
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
    private PaymentRepository paymentRepository;

    @Autowired
    private OutboxEventRepository outboxEventRepository;

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("TRUNCATE TABLE payments, outbox_events, processed_events RESTART IDENTITY CASCADE");
    }

    @Test
    void inventoryReservedThenRefundRequestedProcessesPaymentLifecycleWithIdempotency() throws Exception {
        Long orderId = 501L;

        InventoryReservedEvent reservedEvent = new InventoryReservedEvent(orderId, new BigDecimal("149.99"));
        kafkaTemplate.send("inventory-reserved", String.valueOf(orderId), reservedEvent).get(10, TimeUnit.SECONDS);
        awaitPaymentStatus(orderId, "COMPLETED", Duration.ofSeconds(10));

        long paymentSuccessOutbox = outboxEventRepository.findAll().stream()
                .filter(event -> "payment-success".equals(event.getTopic()))
                .filter(event -> Objects.equals(event.getAggregateKey(), String.valueOf(orderId)))
                .count();
        assertEquals(1L, paymentSuccessOutbox);

        // Duplicate event should be deduplicated and not create another processed row.
        kafkaTemplate.send("inventory-reserved", String.valueOf(orderId), reservedEvent).get(10, TimeUnit.SECONDS);
        Thread.sleep(800);
        Integer processedRows = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM processed_events WHERE event_key = ?",
                Integer.class,
                "inventory-reserved:" + orderId);
        assertEquals(1, processedRows);

        kafkaTemplate.send("refund-requested", String.valueOf(orderId), new RefundRequestedEvent(orderId))
                .get(10, TimeUnit.SECONDS);
        awaitPaymentStatus(orderId, "REFUNDED", Duration.ofSeconds(10));

        long refundSuccessOutbox = outboxEventRepository.findAll().stream()
                .filter(event -> "refund-success".equals(event.getTopic()))
                .filter(event -> Objects.equals(event.getAggregateKey(), String.valueOf(orderId)))
                .count();
        assertEquals(1L, refundSuccessOutbox);
    }

    private void awaitPaymentStatus(Long orderId, String expectedStatus, Duration timeout) throws InterruptedException {
        long deadline = System.currentTimeMillis() + timeout.toMillis();
        while (System.currentTimeMillis() < deadline) {
            Payment payment = paymentRepository.findByOrderId(orderId).orElse(null);
            if (payment != null && expectedStatus.equals(payment.getStatus())) {
                return;
            }
            Thread.sleep(100);
        }
        Payment latest = paymentRepository.findByOrderId(orderId).orElse(null);
        String actualStatus = latest == null ? "<missing>" : latest.getStatus();
        fail("Timed out waiting for payment status " + expectedStatus + " for order " + orderId + ", actual " + actualStatus);
    }
}
