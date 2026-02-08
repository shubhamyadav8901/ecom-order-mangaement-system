package com.ecommerce.inventory.outbox;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@SpringBootTest(properties = "spring.task.scheduling.enabled=false")
class OutboxPublisherIntegrationTest {

    @Autowired
    private OutboxEventRepository outboxEventRepository;

    @Autowired
    private OutboxPublisher outboxPublisher;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @MockBean
    private KafkaTemplate<String, Object> kafkaTemplate;

    @BeforeEach
    void setup() {
        jdbcTemplate.execute("TRUNCATE TABLE outbox_events RESTART IDENTITY");
        when(kafkaTemplate.send(anyString(), anyString(), any()))
                .thenReturn(CompletableFuture.completedFuture(null));
    }

    @Test
    void publishPending_claimsExpectedRows_andSkipsFreshOrExhausted() {
        OutboxEvent pending = saveEvent("inventory-reserved:1:a", OutboxStatus.PENDING, 0, "inventory-reserved", "inventory-reserved", "1",
                "{\"orderId\":1,\"totalAmount\":100}");
        OutboxEvent failed = saveEvent("inventory-failed:2:b", OutboxStatus.FAILED, 1, "inventory-failed", "inventory-failed", "2",
                "{\"orderId\":2,\"reason\":\"x\"}");
        OutboxEvent staleInProgress = saveEvent("inventory-failed:3:c", OutboxStatus.IN_PROGRESS, 2, "inventory-failed", "inventory-failed", "3",
                "{\"orderId\":3,\"reason\":\"x\"}");
        setUpdatedAt(staleInProgress.getId(), LocalDateTime.now().minusMinutes(5));

        OutboxEvent freshInProgress = saveEvent("inventory-reserved:4:d", OutboxStatus.IN_PROGRESS, 1, "inventory-reserved", "inventory-reserved", "4",
                "{\"orderId\":4,\"totalAmount\":50}");
        OutboxEvent exhausted = saveEvent("inventory-failed:5:e", OutboxStatus.FAILED, 10, "inventory-failed", "inventory-failed", "5",
                "{\"orderId\":5,\"reason\":\"x\"}");

        outboxPublisher.publishPending();

        assertEquals(OutboxStatus.PUBLISHED, reload(pending).getStatus());
        assertEquals(OutboxStatus.PUBLISHED, reload(failed).getStatus());
        assertEquals(OutboxStatus.PUBLISHED, reload(staleInProgress).getStatus());

        assertEquals(OutboxStatus.IN_PROGRESS, reload(freshInProgress).getStatus());
        assertEquals(OutboxStatus.FAILED, reload(exhausted).getStatus());
        assertNotNull(reload(pending).getPublishedAt());
    }

    private OutboxEvent saveEvent(String eventKey, OutboxStatus status, int attempts,
                                  String topic, String eventType, String aggregateKey, String payload) {
        return outboxEventRepository.save(OutboxEvent.builder()
                .eventKey(eventKey + ":" + UUID.randomUUID())
                .status(status)
                .attemptCount(attempts)
                .topic(topic)
                .eventType(eventType)
                .aggregateKey(aggregateKey)
                .payload(payload)
                .build());
    }

    private OutboxEvent reload(OutboxEvent event) {
        return outboxEventRepository.findById(event.getId()).orElseThrow();
    }

    private void setUpdatedAt(Long id, LocalDateTime timestamp) {
        jdbcTemplate.update("UPDATE outbox_events SET updated_at = ? WHERE id = ?",
                Timestamp.valueOf(timestamp), id);
    }
}
