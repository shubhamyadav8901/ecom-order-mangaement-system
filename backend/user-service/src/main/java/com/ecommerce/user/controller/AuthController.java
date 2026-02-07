package com.ecommerce.user.controller;

import com.ecommerce.user.dto.*;
import com.ecommerce.user.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request, jakarta.servlet.http.HttpServletResponse response) {
        AuthResponse authResponse = authService.login(request);

        // Set HttpOnly Cookie
        jakarta.servlet.http.Cookie cookie = new jakarta.servlet.http.Cookie("refresh_token", authResponse.refreshToken());
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // Set to true in production (HTTPS)
        cookie.setPath("/");
        cookie.setMaxAge(7 * 24 * 60 * 60); // 7 days
        response.addCookie(cookie);

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
    public ResponseEntity<Void> logout(jakarta.servlet.http.HttpServletResponse response) {
        jakarta.servlet.http.Cookie cookie = new jakarta.servlet.http.Cookie("refresh_token", "");
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // Set to true in production (HTTPS)
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
        return ResponseEntity.noContent().build();
    }
}
