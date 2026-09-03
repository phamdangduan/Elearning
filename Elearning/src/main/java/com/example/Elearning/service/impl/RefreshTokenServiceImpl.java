package com.example.Elearning.service.impl;

import com.example.Elearning.config.JwtProperties;
import com.example.Elearning.entity.RefreshToken;
import com.example.Elearning.exception.AppException;
import com.example.Elearning.exception.ErrorCode;
import com.example.Elearning.repository.RefreshTokenRepository;
import com.example.Elearning.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class RefreshTokenServiceImpl implements RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtProperties jwtProperties;

    @Override
    public String createRefreshToken(String username) {
        RefreshToken refreshToken = RefreshToken.builder()
                .username(username)
                .expiryTime(Instant.now().plusSeconds(jwtProperties.getRefreshTokenExpiry()))
                .build();
        refreshTokenRepository.save(refreshToken);
        log.info("Created refresh token for user: {}", username);
        return refreshToken.getToken();
    }

    @Override
    @Transactional
    public RefreshToken verifyRefreshToken(String tokenStr) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(tokenStr)
                .orElseThrow(() -> {
                    log.warn("Refresh token not found: {}", tokenStr);
                    return new AppException(ErrorCode.AUTHENTICATION_FAILED);
                });

        // Step 2: Reuse detection — token already revoked
        if (refreshToken.isRevoked()) {
            log.warn("REUSE ATTACK DETECTED — revoked token used by: {}", refreshToken.getUsername());
            revokeAllTokensForUser(refreshToken.getUsername());
            throw new AppException(ErrorCode.REFRESH_TOKEN_REVOKED);
        }

        // Step 3: Expiry check
        if (refreshToken.getExpiryTime().isBefore(Instant.now())) {
            log.warn("Refresh token expired for user: {}", refreshToken.getUsername());
            throw new AppException(ErrorCode.AUTHENTICATION_FAILED);
        }

        return refreshToken;
    }

    @Override
    public void revokeToken(RefreshToken refreshToken) {
        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);
        log.info("Revoked refresh token for user: {}", refreshToken.getUsername());
    }

    @Override
    public void revokeAllTokensForUser(String username) {
        refreshTokenRepository.revokeAllByUsername(username);
        log.info("Revoked all refresh tokens for user: {}", username);
    }
}
