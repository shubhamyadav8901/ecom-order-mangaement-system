package com.ecommerce.order.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.serializer.DeserializationException;
import org.springframework.transaction.UnexpectedRollbackException;
import org.springframework.util.backoff.FixedBackOff;

@Configuration
@EnableKafka
public class KafkaConfig {
    private static final Logger logger = LoggerFactory.getLogger(KafkaConfig.class);

    @Bean
    public DefaultErrorHandler kafkaErrorHandler() {
        // Do not retry known non-recoverable failures (duplicate dedupe keys, bad payloads, etc.).
        DefaultErrorHandler errorHandler = new DefaultErrorHandler((record, ex) ->
                logger.error("Skipping Kafka record after non-recoverable failure. topic={}, partition={}, offset={}",
                        record.topic(), record.partition(), record.offset(), ex), new FixedBackOff(0L, 0L));
        errorHandler.addNotRetryableExceptions(
                DataIntegrityViolationException.class,
                UnexpectedRollbackException.class,
                DeserializationException.class);
        return errorHandler;
    }
}
