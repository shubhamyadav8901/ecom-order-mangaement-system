package com.ecommerce.inventory.outbox;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.micrometer.tracing.Span;
import io.micrometer.tracing.TraceContext;
import io.micrometer.tracing.Tracer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@SuppressWarnings("null")
public class OutboxService {

    @Autowired
    private OutboxEventRepository outboxEventRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private Tracer tracer;

    @Transactional
    public void enqueue(String topic, String aggregateKey, String eventType, Object payload) {
        try {
            OutboxEvent.OutboxEventBuilder eventBuilder = OutboxEvent.builder()
                    .eventKey(eventType + ":" + aggregateKey + ":" + UUID.randomUUID())
                    .topic(topic)
                    .aggregateKey(aggregateKey)
                    .eventType(eventType)
                    .payload(objectMapper.writeValueAsString(payload))
                    .status(OutboxStatus.PENDING)
                    .attemptCount(0);

            Span currentSpan = tracer.currentSpan();
            if (currentSpan != null) {
                TraceContext traceContext = currentSpan.context();
                eventBuilder.traceId(traceContext.traceId())
                        .parentSpanId(traceContext.spanId())
                        .traceSampled(traceContext.sampled());
            }

            OutboxEvent event = eventBuilder.build();
            outboxEventRepository.save(event);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Failed to serialize outbox payload", ex);
        }
    }
}
