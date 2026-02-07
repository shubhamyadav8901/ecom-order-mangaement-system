package com.ecommerce.order;

import com.ecommerce.order.dto.OrderRequest;
import com.ecommerce.order.dto.OrderItemRequest;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.kafka.core.KafkaTemplate;
import com.ecommerce.common.security.CustomPrincipal;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;

@SpringBootTest
@AutoConfigureMockMvc
public class OrderIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Test
    public void testCreateOrder() throws Exception {
        OrderItemRequest item = new OrderItemRequest(1L, 2, new BigDecimal("50.00"));
        OrderRequest request = new OrderRequest(List.of(item));
        CustomPrincipal principal = new CustomPrincipal(
                "test@example.com",
                "",
                List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")),
                1L);
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                principal.getAuthorities());

        mockMvc.perform(post("/orders")
                .with(authentication(auth))
                .contentType(Objects.requireNonNull(MediaType.APPLICATION_JSON))
                .content(Objects.requireNonNull(objectMapper.writeValueAsString(request))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CREATED"))
                .andExpect(jsonPath("$.totalAmount").value(100.00));
    }
}
