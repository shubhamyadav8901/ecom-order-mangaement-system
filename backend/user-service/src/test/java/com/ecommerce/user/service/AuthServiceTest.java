package com.ecommerce.user.service;

import com.ecommerce.common.security.JwtTokenProvider;
import com.ecommerce.user.domain.RefreshToken;
import com.ecommerce.user.domain.User;
import com.ecommerce.user.dto.AuthResponse;
import com.ecommerce.user.dto.RefreshTokenRequest;
import com.ecommerce.user.repository.RefreshTokenRepository;
import com.ecommerce.user.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private AuthService authService;

    @Test
    void refreshTokenWithValidUnexpiredTokenReturnsNewAccessToken() {
        User user = sampleUser(1L, "user@example.com", "ROLE_CUSTOMER");
        RefreshToken token = RefreshToken.builder()
                .user(user)
                .token("valid-rt")
                .expiryDate(LocalDateTime.now().plusMinutes(30))
                .build();

        when(refreshTokenRepository.findByToken("valid-rt")).thenReturn(Optional.of(token));
        when(tokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole())).thenReturn("new-access-token");

        AuthResponse response = authService.refreshToken(new RefreshTokenRequest("valid-rt"));

        assertEquals("new-access-token", response.accessToken());
        assertEquals("valid-rt", response.refreshToken());
        verify(refreshTokenRepository).findByToken("valid-rt");
    }

    @Test
    void refreshTokenWithExpiredTokenDeletesAndThrowsUnauthorized() {
        User user = sampleUser(2L, "expired@example.com", "ROLE_CUSTOMER");
        RefreshToken token = RefreshToken.builder()
                .user(user)
                .token("expired-rt")
                .expiryDate(LocalDateTime.now().minusMinutes(1))
                .build();

        when(refreshTokenRepository.findByToken("expired-rt")).thenReturn(Optional.of(token));

        BadCredentialsException ex = assertThrows(BadCredentialsException.class,
                () -> authService.refreshToken(new RefreshTokenRequest("expired-rt")));

        assertEquals("Refresh token was expired. Please sign in again", ex.getMessage());
        verify(refreshTokenRepository).delete(token);
    }

    @Test
    void refreshTokenWithUnknownTokenThrowsUnauthorized() {
        when(refreshTokenRepository.findByToken("missing")).thenReturn(Optional.empty());

        BadCredentialsException ex = assertThrows(BadCredentialsException.class,
                () -> authService.refreshToken(new RefreshTokenRequest("missing")));

        assertEquals("Refresh token is not valid", ex.getMessage());
    }

    private User sampleUser(Long id, String email, String role) {
        return User.builder()
                .id(id)
                .email(email)
                .password("encoded")
                .firstName("First")
                .lastName("Last")
                .role(role)
                .build();
    }
}
