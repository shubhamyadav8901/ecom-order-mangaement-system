package com.ecommerce.user.service;

import com.ecommerce.user.domain.RefreshToken;
import com.ecommerce.user.domain.User;
import com.ecommerce.user.dto.AuthResponse;
import com.ecommerce.user.dto.LoginRequest;
import com.ecommerce.user.dto.RegisterRequest;
import com.ecommerce.user.repository.UserRepository;
import com.ecommerce.common.security.JwtTokenProvider;

import java.util.Objects;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    @Autowired
    private com.ecommerce.user.repository.RefreshTokenRepository refreshTokenRepository;

    @Value("${app.jwt.refresh-expiration-milliseconds}")
    private long refreshExpirationInMs;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new RuntimeException("Email already in use");
        }

        User user = Objects.requireNonNull(
                User.builder()
                        .email(request.email())
                        .password(passwordEncoder.encode(request.password()))
                        .firstName(request.firstName())
                        .lastName(request.lastName())
                        .role("ROLE_CUSTOMER") // Default role
                        .build());

        userRepository.save(user);

        return login(new LoginRequest(request.email(), request.password()));
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

        SecurityContextHolder.getContext().setAuthentication(authentication);

        User user = userRepository.findByEmail(request.email()).orElseThrow();
        // Assuming role is simple string in DB, usually it's "ROLE_USER"
        String jwt = tokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole());
        RefreshToken refreshToken = createRefreshToken(user);

        return new AuthResponse(jwt, refreshToken.getToken());
    }

    @Transactional
    public AuthResponse refreshToken(com.ecommerce.user.dto.RefreshTokenRequest request) {
        return refreshTokenRepository.findByToken(request.refreshToken())
                .map(this::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String token = tokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole());
                    return new AuthResponse(token, request.refreshToken());
                })
                .orElseThrow(() -> new RuntimeException("Refresh token is not in database!"));
    }

    private RefreshToken createRefreshToken(User user) {
        // Delete existing token if any
        refreshTokenRepository.deleteByUser(user);

        RefreshToken refreshToken = Objects.requireNonNull(
                RefreshToken.builder()
                        .user(user)
                        .expiryDate(java.time.LocalDateTime.now().plusNanos(refreshExpirationInMs * 1000000))
                        .token(java.util.UUID.randomUUID().toString())
                        .build());
        return refreshTokenRepository.save(refreshToken);
    }

    private RefreshToken verifyExpiration(RefreshToken token) {
        if (token.getExpiryDate().isBefore(java.time.LocalDateTime.now())) {
            refreshTokenRepository.delete(token);
            throw new RuntimeException("Refresh token was expired. Please make a new signin request");
        }
        return token;
    }
}
