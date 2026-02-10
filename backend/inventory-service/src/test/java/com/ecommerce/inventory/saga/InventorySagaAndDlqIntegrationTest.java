package com.ecommerce.inventory.saga;

import com.ecommerce.inventory.domain.Inventory;
import com.ecommerce.inventory.domain.InventoryReservation;
import com.ecommerce.inventory.event.OrderCancelledEvent;
import com.ecommerce.inventory.event.OrderCreatedEvent;
import com.ecommerce.inventory.event.OrderItemEvent;
import com.ecommerce.inventory.repository.InventoryRepository;
import com.ecommerce.inventory.repository.InventoryReservationRepository;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.serialization.ByteArrayDeserializer;
import org.apache.kafka.common.serialization.ByteArraySerializer;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
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
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.fail;

@SpringBootTest(properties = "spring.task.scheduling.enabled=false")
@Testcontainers(disabledWithoutDocker = true)
@SuppressWarnings("null")
class InventorySagaAndDlqIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("inventory_saga_test_db")
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
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private InventoryReservationRepository reservationRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        jdbcTemplate.execute("TRUNCATE TABLE inventory_reservations, outbox_events, processed_events RESTART IDENTITY CASCADE");
        jdbcTemplate.update(
                "UPDATE inventory SET available_stock = ?, reserved_stock = ? WHERE product_id = ?",
                50, 0, 1L);
    }

    @Test
    void orderCreatedThenCancelledReservesAndReleasesInventory() throws Exception {
        long orderId = 7001L;
        OrderCreatedEvent orderCreated = new OrderCreatedEvent(
                orderId,
                100L,
                new BigDecimal("99.99"),
                List.of(new OrderItemEvent(1L, 3)));

        kafkaTemplate.send("order-created", String.valueOf(orderId), orderCreated).get(10, TimeUnit.SECONDS);
        awaitInventoryState(1L, 47, 3, Duration.ofSeconds(10));

        Optional<InventoryReservation> reserved = reservationRepository.findByOrderIdAndProductId(orderId, 1L);
        assertEquals("RESERVED", reserved.map(InventoryReservation::getStatus).orElse("<missing>"));

        kafkaTemplate.send("order-cancelled", String.valueOf(orderId), new OrderCancelledEvent(orderId))
                .get(10, TimeUnit.SECONDS);
        awaitInventoryState(1L, 50, 0, Duration.ofSeconds(10));

        Optional<InventoryReservation> cancelled = reservationRepository.findByOrderIdAndProductId(orderId, 1L);
        assertEquals("CANCELLED", cancelled.map(InventoryReservation::getStatus).orElse("<missing>"));
    }

    @Test
    void malformedOrderCancelledEventIsSentToDeadLetterTopic() throws Exception {
        String orderIdKey = "7999";
        String badTypeId = "com.ecommerce.order.event.MissingOrderCancelledEvent";

        try (KafkaConsumer<String, byte[]> consumer = createDlqConsumer();
             KafkaProducer<String, byte[]> producer = createRawProducer()) {
            consumer.subscribe(List.of("order-cancelled.DLT"));

            ProducerRecord<String, byte[]> badRecord = new ProducerRecord<>(
                    "order-cancelled",
                    orderIdKey,
                    "{\"orderId\":7999}".getBytes(StandardCharsets.UTF_8));
            badRecord.headers().add("__TypeId__", badTypeId.getBytes(StandardCharsets.UTF_8));
            producer.send(badRecord).get(10, TimeUnit.SECONDS);

            ConsumerRecord<String, byte[]> dltRecord =
                    pollForRecord(consumer, "order-cancelled.DLT", orderIdKey, Duration.ofSeconds(15));
            assertNotNull(dltRecord);
            assertEquals(orderIdKey, dltRecord.key());
        }
    }

    private void awaitInventoryState(Long productId, int expectedAvailable, int expectedReserved, Duration timeout)
            throws InterruptedException {
        long deadline = System.currentTimeMillis() + timeout.toMillis();
        while (System.currentTimeMillis() < deadline) {
            Inventory inventory = inventoryRepository.findByProductId(productId).orElse(null);
            if (inventory != null
                    && inventory.getAvailableStock() == expectedAvailable
                    && inventory.getReservedStock() == expectedReserved) {
                return;
            }
            Thread.sleep(100);
        }
        Inventory latest = inventoryRepository.findByProductId(productId).orElse(null);
        int available = latest == null ? -1 : latest.getAvailableStock();
        int reserved = latest == null ? -1 : latest.getReservedStock();
        fail("Timed out waiting for inventory state. productId=" + productId
                + ", expected available/reserved=" + expectedAvailable + "/" + expectedReserved
                + ", actual=" + available + "/" + reserved);
    }

    private KafkaConsumer<String, byte[]> createDlqConsumer() {
        Map<String, Object> props = Map.of(
                ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, KAFKA.getBootstrapServers(),
                ConsumerConfig.GROUP_ID_CONFIG, "inventory-dlt-test-" + UUID.randomUUID(),
                ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest",
                ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class,
                ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, ByteArrayDeserializer.class
        );
        return new KafkaConsumer<>(props);
    }

    private KafkaProducer<String, byte[]> createRawProducer() {
        Map<String, Object> props = Map.of(
                ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, KAFKA.getBootstrapServers(),
                ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class,
                ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, ByteArraySerializer.class
        );
        return new KafkaProducer<>(props);
    }

    private ConsumerRecord<String, byte[]> pollForRecord(
            KafkaConsumer<String, byte[]> consumer,
            String topic,
            String key,
            Duration timeout) {
        long deadline = System.currentTimeMillis() + timeout.toMillis();
        while (System.currentTimeMillis() < deadline) {
            ConsumerRecords<String, byte[]> records = consumer.poll(Duration.ofMillis(250));
            for (ConsumerRecord<String, byte[]> record : records) {
                if (topic.equals(record.topic()) && key.equals(record.key())) {
                    return record;
                }
            }
        }
        fail("Timed out waiting for record on " + topic + " with key " + key);
        return null;
    }
}
