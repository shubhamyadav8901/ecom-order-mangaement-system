package com.ecommerce.order.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

@Configuration
public class HttpClientConfig {
    @Bean
    public RestTemplate restTemplate() {
        RestTemplate restTemplate = new RestTemplate();
        restTemplate.getInterceptors().add((request, body, execution) -> {
            String authHeader = resolveAuthorizationHeader();
            if (StringUtils.hasText(authHeader)) {
                request.getHeaders().set(HttpHeaders.AUTHORIZATION, authHeader);
            }
            return execution.execute(request, body);
        });
        return restTemplate;
    }

    private String resolveAuthorizationHeader() {
        RequestAttributes requestAttributes = RequestContextHolder.getRequestAttributes();
        if (!(requestAttributes instanceof ServletRequestAttributes servletRequestAttributes)) {
            return null;
        }
        HttpServletRequest currentRequest = servletRequestAttributes.getRequest();
        if (currentRequest == null) {
            return null;
        }
        return currentRequest.getHeader(HttpHeaders.AUTHORIZATION);
    }
}
