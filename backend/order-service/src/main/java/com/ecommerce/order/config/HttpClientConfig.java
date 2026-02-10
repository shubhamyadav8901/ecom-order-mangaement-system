package com.ecommerce.order.config;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.retry.backoff.FixedBackOffPolicy;
import org.springframework.retry.policy.SimpleRetryPolicy;
import org.springframework.retry.support.RetryTemplate;
import org.springframework.util.StringUtils;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

@Configuration
public class HttpClientConfig {
    @Bean
    public RestTemplate restTemplate(
            RestTemplateBuilder restTemplateBuilder,
            @Value("${services.product.connect-timeout-ms:1000}") long connectTimeoutMs,
            @Value("${services.product.read-timeout-ms:2000}") long readTimeoutMs) {
        RestTemplate restTemplate = restTemplateBuilder
                .setConnectTimeout(Duration.ofMillis(connectTimeoutMs))
                .setReadTimeout(Duration.ofMillis(readTimeoutMs))
                .build();
        restTemplate.getInterceptors().add((request, body, execution) -> {
            String authHeader = resolveAuthorizationHeader();
            if (StringUtils.hasText(authHeader)) {
                request.getHeaders().set(HttpHeaders.AUTHORIZATION, authHeader);
            }
            return execution.execute(request, body);
        });
        return restTemplate;
    }

    @Bean
    public RetryTemplate productCatalogRetryTemplate(
            @Value("${services.product.retry-max-attempts:3}") int maxAttempts,
            @Value("${services.product.retry-backoff-ms:200}") long backoffMs) {
        Map<Class<? extends Throwable>, Boolean> retryable = new HashMap<>();
        retryable.put(ResourceAccessException.class, true);
        retryable.put(HttpServerErrorException.class, true);
        retryable.put(RuntimeException.class, false);

        SimpleRetryPolicy retryPolicy = new SimpleRetryPolicy(maxAttempts, retryable, true);
        FixedBackOffPolicy backOffPolicy = new FixedBackOffPolicy();
        backOffPolicy.setBackOffPeriod(backoffMs);

        RetryTemplate retryTemplate = new RetryTemplate();
        retryTemplate.setRetryPolicy(retryPolicy);
        retryTemplate.setBackOffPolicy(backOffPolicy);
        return retryTemplate;
    }

    private String resolveAuthorizationHeader() {
        RequestAttributes requestAttributes = RequestContextHolder.getRequestAttributes();
        if (!(requestAttributes instanceof ServletRequestAttributes servletRequestAttributes)) {
            return null;
        }
        HttpServletRequest currentRequest = servletRequestAttributes.getRequest();
        return currentRequest.getHeader(HttpHeaders.AUTHORIZATION);
    }
}
