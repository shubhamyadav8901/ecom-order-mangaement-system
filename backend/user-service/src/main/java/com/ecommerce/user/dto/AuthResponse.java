package com.ecommerce.user.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;

public record AuthResponse(String accessToken, @JsonIgnore String refreshToken, String tokenType) {
    public AuthResponse(String accessToken, String refreshToken) {
        this(accessToken, refreshToken, "Bearer");
    }
}
