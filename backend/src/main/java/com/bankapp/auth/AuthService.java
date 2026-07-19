package com.bankapp.auth;

import com.bankapp.auth.AuthDtos.LoginRequest;
import com.bankapp.auth.AuthDtos.RefreshRequest;
import com.bankapp.auth.AuthDtos.TokenResponse;
import com.bankapp.common.ApiException;
import com.bankapp.user.User;
import com.bankapp.user.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public TokenResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> ApiException.unauthorized("Invalid username or password"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw ApiException.unauthorized("Invalid username or password");
        }
        return tokens(user);
    }

    public TokenResponse refresh(RefreshRequest request) {
        Claims claims;
        try {
            claims = jwtService.parse(request.refreshToken());
        } catch (JwtException | IllegalArgumentException e) {
            throw ApiException.unauthorized("Invalid refresh token");
        }
        if (!"refresh".equals(claims.get("typ"))) {
            throw ApiException.unauthorized("Not a refresh token");
        }
        User user = userRepository.findById(UUID.fromString(claims.getSubject()))
                .orElseThrow(() -> ApiException.unauthorized("User no longer exists"));
        return tokens(user); // rotation: a fresh refresh token on every use
    }

    private TokenResponse tokens(User user) {
        return new TokenResponse(
                jwtService.createAccessToken(user.getId(), user.getUsername()),
                jwtService.createRefreshToken(user.getId()),
                jwtService.getAccessTtlSeconds());
    }
}
