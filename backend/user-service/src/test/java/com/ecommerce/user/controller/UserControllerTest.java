package com.ecommerce.user.controller;

import com.ecommerce.common.exception.GlobalExceptionHandler;
import com.ecommerce.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Optional;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyIterable;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserController userController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getCurrentUserSuccess() throws Exception {
        UserDetails principal = User.withUsername("customer@example.com")
                .password("ignored")
                .roles("CUSTOMER")
                .build();
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));

        com.ecommerce.user.domain.User user = com.ecommerce.user.domain.User.builder()
                .id(11L)
                .email("customer@example.com")
                .firstName("Test")
                .lastName("Customer")
                .role("ROLE_CUSTOMER")
                .password("encoded")
                .build();
        when(userRepository.findByEmail("customer@example.com")).thenReturn(Optional.of(user));

        mockMvc.perform(get("/users/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(11L))
                .andExpect(jsonPath("$.email").value("customer@example.com"))
                .andExpect(jsonPath("$.role").value("ROLE_CUSTOMER"));
    }

    @Test
    void getCurrentUserUserNotFoundReturnsNotFound() throws Exception {
        UserDetails principal = User.withUsername("missing@example.com")
                .password("ignored")
                .roles("CUSTOMER")
                .build();
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));

        when(userRepository.findByEmail("missing@example.com")).thenReturn(Optional.empty());

        mockMvc.perform(get("/users/me"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("User not found"));
    }

    @Test
    void getUserByIdSuccess() throws Exception {
        com.ecommerce.user.domain.User user = com.ecommerce.user.domain.User.builder()
                .id(7L)
                .email("buyer@example.com")
                .firstName("Buyer")
                .lastName("One")
                .role("ROLE_CUSTOMER")
                .password("encoded")
                .build();
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));

        mockMvc.perform(get("/users/7"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(7L))
                .andExpect(jsonPath("$.email").value("buyer@example.com"))
                .andExpect(jsonPath("$.firstName").value("Buyer"))
                .andExpect(jsonPath("$.lastName").value("One"));
    }

    @Test
    void getUserByIdNotFoundReturnsNotFound() throws Exception {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/users/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("User not found with id: 999"));
    }

    @Test
    void getUsersByIdsReturnsUsers() throws Exception {
        com.ecommerce.user.domain.User userOne = com.ecommerce.user.domain.User.builder()
                .id(7L)
                .email("buyer@example.com")
                .firstName("Buyer")
                .lastName("One")
                .role("ROLE_CUSTOMER")
                .password("encoded")
                .build();

        com.ecommerce.user.domain.User userTwo = com.ecommerce.user.domain.User.builder()
                .id(8L)
                .email("admin@example.com")
                .firstName("Admin")
                .lastName("Two")
                .role("ROLE_ADMIN")
                .password("encoded")
                .build();

        when(userRepository.findAllById(anyIterable())).thenReturn(List.of(userOne, userTwo));

        mockMvc.perform(post("/users/batch")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(List.of(7L, 8L))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(7L))
                .andExpect(jsonPath("$[0].email").value("buyer@example.com"))
                .andExpect(jsonPath("$[1].id").value(8L))
                .andExpect(jsonPath("$[1].email").value("admin@example.com"));
    }
}
