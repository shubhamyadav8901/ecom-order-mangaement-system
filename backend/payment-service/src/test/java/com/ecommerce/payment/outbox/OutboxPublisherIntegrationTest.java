package com.ecommerce.payment.outbox;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.messaging.Message;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@SpringBootTest(properties = "spring.task.scheduling.enabled=false")
@SuppressWarnings("null")
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
        when(kafkaTemplate.send(any(Message.class)))
                .thenReturn(CompletableFuture.completedFuture(null));
    }

    @Test
    void publishPending_claimsExpectedRows_andSkipsFreshOrExhausted() {
        OutboxEvent pending = saveEvent("payment-success:1:a", OutboxStatus.PENDING, 0, "payment-success", "payment-success", "1",
                "{\"orderId\":1,\"transactionId\":\"tx1\"}");
        OutboxEvent failed = saveEvent("payment-failed:2:b", OutboxStatus.FAILED, 1, "payment-failed", "payment-failed", "2",
                "{\"orderId\":2,\"reason\":\"x\"}");
        OutboxEvent staleInProgress = saveEvent("payment-failed:3:c", OutboxStatus.IN_PROGRESS, 2, "payment-failed", "payment-failed", "3",
                "{\"orderId\":3,\"reason\":\"x\"}");
        setUpdatedAt(staleInProgress.getId(), LocalDateTime.now().minusMinutes(5));

        OutboxEvent freshInProgress = saveEvent("payment-success:4:d", OutboxStatus.IN_PROGRESS, 1, "payment-success", "payment-success", "4",
                "{\"orderId\":4,\"transactionId\":\"tx4\"}");
        OutboxEvent exhausted = saveEvent("payment-failed:5:e", OutboxStatus.FAILED, 10, "payment-failed", "payment-failed", "5",
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
