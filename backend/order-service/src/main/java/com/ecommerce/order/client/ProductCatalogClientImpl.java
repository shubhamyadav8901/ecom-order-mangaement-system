package com.ecommerce.order.client;

import com.ecommerce.common.exception.ResourceConflictException;
import com.ecommerce.common.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.retry.support.RetryTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

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
        ProductInfo product = getProducts(List.of(productId)).get(productId);
        if (product == null) {
            throw new ResourceNotFoundException("Product not found with id: " + productId);
        }
        return product;
    }

    @Override
    public Map<Long, ProductInfo> getProducts(List<Long> productIds) {
        Set<Long> uniqueProductIds = productIds == null
                ? Set.of()
                : productIds.stream()
                        .filter(id -> id != null)
                        .collect(Collectors.toCollection(LinkedHashSet::new));
        if (uniqueProductIds.isEmpty()) {
            return Map.of();
        }

        List<Long> ids = List.copyOf(uniqueProductIds);

        try {
            List<ProductApiResponse> response = retryTemplate.execute(context -> fetchProducts(ids));
            if (response == null) {
                throw new ResourceConflictException("Invalid product payload from catalog");
            }

            Map<Long, ProductInfo> products = new LinkedHashMap<>();
            for (ProductApiResponse product : response) {
                if (product == null || product.id == null || product.price == null) {
                    throw new ResourceConflictException("Invalid product payload from catalog");
                }
                products.put(product.id, new ProductInfo(product.id, product.price, product.status));
            }

            List<Long> missingIds = ids.stream()
                    .filter(id -> !products.containsKey(id))
                    .toList();
            if (!missingIds.isEmpty()) {
                throw new ResourceNotFoundException("Product not found with id: " + missingIds.get(0));
            }

            return products;
        } catch (ResourceNotFoundException ex) {
            throw ex;
        } catch (HttpClientErrorException.NotFound ex) {
            throw new ResourceNotFoundException("Product not found in catalog", ex);
        } catch (HttpClientErrorException ex) {
            throw new ResourceConflictException("Failed to fetch products from catalog", ex);
        } catch (ResourceAccessException ex) {
            throw new ResourceConflictException("Product catalog temporarily unavailable", ex);
        } catch (Exception ex) {
            throw new ResourceConflictException("Unexpected catalog error", ex);
        }
    }

    private List<ProductApiResponse> fetchProducts(List<Long> productIds) {
        String url = UriComponentsBuilder.fromHttpUrl(productServiceBaseUrl + "/products/batch")
                .queryParam("ids", productIds.toArray())
                .toUriString();

        ResponseEntity<List<ProductApiResponse>> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                null,
                new ParameterizedTypeReference<>() {
                });

        return response.getBody();
    }

    private static final class ProductApiResponse {
        public Long id;
        public BigDecimal price;
        public String status;
    }
}
