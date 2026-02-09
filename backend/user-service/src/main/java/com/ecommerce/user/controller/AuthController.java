package com.ecommerce.user.controller;

import com.ecommerce.user.dto.*;
import jakarta.validation.Valid;
import com.ecommerce.user.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@SuppressWarnings("null")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest request,
            jakarta.servlet.http.HttpServletRequest servletRequest,
            jakarta.servlet.http.HttpServletResponse response) {
        AuthResponse authResponse = authService.login(request);
        boolean secure = isSecureRequest(servletRequest);
        response.addHeader(HttpHeaders.SET_COOKIE, buildRefreshTokenCookie(authResponse.refreshToken(), secure, false).toString());

        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<AuthResponse> refreshToken(jakarta.servlet.http.HttpServletRequest request) {
        String refreshToken = null;
        if (request.getCookies() != null) {
            for (jakarta.servlet.http.Cookie cookie : request.getCookies()) {
                if ("refresh_token".equals(cookie.getName())) {
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }

        if (refreshToken == null) {
             return ResponseEntity.status(401).build();
        }

        return ResponseEntity.ok(authService.refreshToken(new RefreshTokenRequest(refreshToken)));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            jakarta.servlet.http.HttpServletRequest servletRequest,
            jakarta.servlet.http.HttpServletResponse response) {
        boolean secure = isSecureRequest(servletRequest);
        response.addHeader(HttpHeaders.SET_COOKIE, buildRefreshTokenCookie("", secure, true).toString());
        return ResponseEntity.noContent().build();
    }

    private ResponseCookie buildRefreshTokenCookie(String token, boolean secure, boolean clear) {
        return ResponseCookie.from("refresh_token", token)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Strict")
                .path("/")
                .maxAge(clear ? 0 : (7L * 24 * 60 * 60))
                .build();
    }

    private boolean isSecureRequest(jakarta.servlet.http.HttpServletRequest request) {
        String forwardedProto = request.getHeader("X-Forwarded-Proto");
        return request.isSecure() || (forwardedProto != null && "https".equalsIgnoreCase(forwardedProto));
    }
}
