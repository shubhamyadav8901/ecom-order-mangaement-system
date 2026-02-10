package com.ecommerce.order.client;

import com.ecommerce.common.exception.ResourceConflictException;
import com.ecommerce.common.exception.ResourceNotFoundException;
import com.ecommerce.order.config.HttpClientConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.retry.support.RetryTemplate;
import org.springframework.test.web.client.ExpectedCount;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

@SuppressWarnings("null")
class ProductCatalogClientImplTest {

    private static final String BASE_URL = "http://product-service";

    private RestTemplate restTemplate;
    private MockRestServiceServer mockServer;
    private ProductCatalogClientImpl productCatalogClient;

    @BeforeEach
    void setUp() {
        HttpClientConfig httpClientConfig = new HttpClientConfig();
        restTemplate = httpClientConfig.restTemplate(new org.springframework.boot.web.client.RestTemplateBuilder(), 1000, 2000);
        RetryTemplate retryTemplate = httpClientConfig.productCatalogRetryTemplate(3, 0);
        mockServer = MockRestServiceServer.bindTo(restTemplate).build();
        productCatalogClient = new ProductCatalogClientImpl(restTemplate, retryTemplate, BASE_URL);
    }

    @Test
    void getProductReturnsCatalogDataWhenAvailable() {
        mockServer.expect(requestTo(BASE_URL + "/products/batch?ids=1"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("[{\"id\":1,\"price\":99.99,\"status\":\"ACTIVE\"}]", org.springframework.http.MediaType.APPLICATION_JSON));

        ProductCatalogClient.ProductInfo result = productCatalogClient.getProduct(1L);

        assertEquals(1L, result.id());
        assertEquals("99.99", result.price().toPlainString());
        assertEquals("ACTIVE", result.status());
        mockServer.verify();
    }

    @Test
    void getProductThrowsNotFoundFor404Response() {
        mockServer.expect(requestTo(BASE_URL + "/products/batch?ids=99"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withStatus(HttpStatus.NOT_FOUND));

        assertThrows(ResourceNotFoundException.class, () -> productCatalogClient.getProduct(99L));
        mockServer.verify();
    }

    @Test
    void getProductRetriesTransientServerErrorsThenThrowsConflict() {
        mockServer.expect(ExpectedCount.times(3), requestTo(BASE_URL + "/products/batch?ids=5"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE));

        assertThrows(ResourceConflictException.class, () -> productCatalogClient.getProduct(5L));
        mockServer.verify();
    }

    @Test
    void getProductsReturnsMapForAllIds() {
        mockServer.expect(requestTo(BASE_URL + "/products/batch?ids=1&ids=2"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(
                        "[{\"id\":1,\"price\":99.99,\"status\":\"ACTIVE\"},{\"id\":2,\"price\":15.50,\"status\":\"ACTIVE\"}]",
                        org.springframework.http.MediaType.APPLICATION_JSON));

        var result = productCatalogClient.getProducts(java.util.List.of(1L, 2L));

        assertEquals(2, result.size());
        assertEquals("99.99", result.get(1L).price().toPlainString());
        assertEquals("15.50", result.get(2L).price().toPlainString());
        mockServer.verify();
    }
}
