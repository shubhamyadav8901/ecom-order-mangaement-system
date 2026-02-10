package com.ecommerce.order.client;

import com.ecommerce.common.exception.ResourceConflictException;
import com.ecommerce.common.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.retry.support.RetryTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;

@Component
public class ProductCatalogClientImpl implements ProductCatalogClient {

    private final RestTemplate restTemplate;
    private final RetryTemplate retryTemplate;
    private final String productServiceBaseUrl;

    public ProductCatalogClientImpl(
            RestTemplate restTemplate,
            RetryTemplate productCatalogRetryTemplate,
            @Value("${services.product.base-url}") String productServiceBaseUrl) {
        this.restTemplate = restTemplate;
        this.retryTemplate = productCatalogRetryTemplate;
        this.productServiceBaseUrl = productServiceBaseUrl;
    }

    @Override
    public ProductInfo getProduct(Long productId) {
        try {
            ProductApiResponse response = retryTemplate.execute(context -> fetchProduct(productId));

            if (response == null || response.id == null || response.price == null) {
                throw new ResourceConflictException("Invalid product payload for id: " + productId);
            }

            return new ProductInfo(response.id, response.price, response.status);
        } catch (HttpClientErrorException.NotFound ex) {
            throw new ResourceNotFoundException("Product not found with id: " + productId, ex);
        } catch (HttpClientErrorException ex) {
            throw new ResourceConflictException("Failed to fetch product " + productId + " from catalog", ex);
        } catch (ResourceAccessException ex) {
            throw new ResourceConflictException("Product catalog temporarily unavailable for id: " + productId, ex);
        } catch (Exception ex) {
            throw new ResourceConflictException("Unexpected catalog error for id: " + productId, ex);
        }
    }

    private ProductApiResponse fetchProduct(Long productId) {
        return restTemplate.getForObject(
                productServiceBaseUrl + "/products/{id}",
                ProductApiResponse.class,
                productId);
    }

    private static final class ProductApiResponse {
        public Long id;
        public BigDecimal price;
        public String status;
    }
}
