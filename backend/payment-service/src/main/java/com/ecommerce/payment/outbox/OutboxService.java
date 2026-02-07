package com.ecommerce.payment.outbox;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class OutboxService {

    @Autowired
    private OutboxEventRepository outboxEventRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Transactional
    public void enqueue(String topic, String aggregateKey, String eventType, Object payload) {
        try {
            OutboxEvent event = OutboxEvent.builder()
                    .eventKey(eventType + ":" + aggregateKey + ":" + UUID.randomUUID())
                    .topic(topic)
                    .aggregateKey(aggregateKey)
                    .eventType(eventType)
                    .payload(objectMapper.writeValueAsString(payload))
                    .status(OutboxStatus.PENDING)
                    .attemptCount(0)
                    .build();
            outboxEventRepository.save(event);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize outbox payload", ex);
        }
    }
}
