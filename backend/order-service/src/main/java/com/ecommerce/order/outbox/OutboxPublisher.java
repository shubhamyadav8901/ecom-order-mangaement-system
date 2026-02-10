package com.ecommerce.order.outbox;

import com.ecommerce.common.event.EventContractVersions;
import com.ecommerce.order.event.InventoryFailedEvent;
import com.ecommerce.order.event.OrderCancelledEvent;
import com.ecommerce.order.event.OrderCreatedEvent;
import com.ecommerce.order.event.PaymentFailedEvent;
import com.ecommerce.order.event.PaymentSuccessEvent;
import com.ecommerce.order.event.RefundRequestedEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.KafkaHeaders;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.messaging.Message;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@SuppressWarnings("null")
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
            Message<Object> message = MessageBuilder.withPayload(payload)
                    .setHeader(KafkaHeaders.TOPIC, event.getTopic())
                    .setHeader(KafkaHeaders.KEY, event.getAggregateKey())
                    .setHeader(EventContractVersions.HEADER_NAME, EventContractVersions.versionForTopic(event.getTopic()))
                    .build();
            kafkaTemplate.send(message).get();
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
            case "order-created" -> objectMapper.readValue(payload, OrderCreatedEvent.class);
            case "order-cancelled" -> objectMapper.readValue(payload, OrderCancelledEvent.class);
            case "payment-success" -> objectMapper.readValue(payload, PaymentSuccessEvent.class);
            case "payment-failed" -> objectMapper.readValue(payload, PaymentFailedEvent.class);
            case "inventory-failed" -> objectMapper.readValue(payload, InventoryFailedEvent.class);
            case "refund-requested" -> objectMapper.readValue(payload, RefundRequestedEvent.class);
            default -> throw new IllegalArgumentException("Unknown event type: " + eventType);
        };
    }

    private String truncate(String message) {
        if (message == null) return null;
        return message.length() > 2000 ? message.substring(0, 2000) : message;
    }
}
