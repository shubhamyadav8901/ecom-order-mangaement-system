package com.ecommerce.inventory.outbox;

import com.ecommerce.inventory.event.InventoryFailedEvent;
import com.ecommerce.inventory.event.InventoryReservedEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class OutboxPublisher {

    @Autowired
    private OutboxEventRepository outboxEventRepository;

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${outbox.publisher.batch-size:50}")
    private int batchSize;

    @Value("${outbox.publisher.max-attempts:10}")
    private int maxAttempts;

    @Value("${outbox.publisher.in-progress-timeout-ms:60000}")
    private long inProgressTimeoutMs;

    @Scheduled(fixedDelayString = "${outbox.publisher.fixed-delay-ms:2000}")
    public void publishPending() {
        List<Long> eventIds = claimBatchForPublish();
        for (Long eventId : eventIds) {
            publishOne(eventId);
        }
    }

    @Transactional
    protected List<Long> claimBatchForPublish() {
        LocalDateTime staleBefore = LocalDateTime.now().minusNanos(inProgressTimeoutMs * 1_000_000);
        List<OutboxEvent> events = outboxEventRepository.lockNextBatchForPublish(maxAttempts, staleBefore, batchSize);

        for (OutboxEvent event : events) {
            event.setStatus(OutboxStatus.IN_PROGRESS);
            event.setAttemptCount(event.getAttemptCount() + 1);
        }

        outboxEventRepository.saveAll(events);
        outboxEventRepository.flush();

        return events.stream().map(OutboxEvent::getId).toList();
    }

    protected void publishOne(Long eventId) {
        OutboxEvent event = outboxEventRepository.findById(eventId).orElse(null);
        if (event == null || event.getStatus() != OutboxStatus.IN_PROGRESS) {
            return;
        }

        try {
            Object payload = deserialize(event.getEventType(), event.getPayload());
            kafkaTemplate.send(event.getTopic(), event.getAggregateKey(), payload).get();
            event.setStatus(OutboxStatus.PUBLISHED);
            event.setPublishedAt(LocalDateTime.now());
            event.setLastError(null);
        } catch (Exception ex) {
            event.setStatus(OutboxStatus.FAILED);
            event.setLastError(truncate(ex.getMessage()));
        }

        outboxEventRepository.save(event);
    }

    private Object deserialize(String eventType, String payload) throws Exception {
        return switch (eventType) {
            case "inventory-reserved" -> objectMapper.readValue(payload, InventoryReservedEvent.class);
            case "inventory-failed" -> objectMapper.readValue(payload, InventoryFailedEvent.class);
            default -> throw new IllegalArgumentException("Unknown event type: " + eventType);
        };
    }

    private String truncate(String message) {
        if (message == null) return null;
        return message.length() > 2000 ? message.substring(0, 2000) : message;
    }
}
