package com.example.Elearning.utils;

import com.example.Elearning.config.JwtProperties;
import com.example.Elearning.entity.User;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * JWT utility using Nimbus JOSE library with HS512 algorithm.
 * Only handles ACCESS token generation.
 * Refresh tokens are plain UUID strings managed by RefreshTokenService (DB-backed).
 *
 * Token claims layout:
 *   sub     = user email (principal identifier for Spring Security)
 *   userId  = user UUID (for service-layer lookups)
 *   scope   = space-separated ROLE_XXX strings (read by JwtAuthConverter)
 *   iss     = issuer
 *   iat     = issued-at
 *   exp     = expiration
 *   jti     = unique token ID (UUID, for future revocation/tracking)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtUtil {

    private final JwtProperties jwtProperties;

    /**
     * Generates a signed HS512 access token for the given user.
     *
     * @param user the authenticated user entity
     * @return serialized compact JWT string
     */
    public String generateAccessToken(User user) {
        try {
            String scope = buildScope(user);
            Instant now = Instant.now();

            JWTClaimsSet claimsSet = new JWTClaimsSet.Builder()
                    .subject(user.getEmail())
                    .issuer(jwtProperties.getIssuer())
                    .issueTime(Date.from(now))
                    .expirationTime(Date.from(now.plusSeconds(jwtProperties.getAccessTokenExpiry())))
                    .jwtID(UUID.randomUUID().toString())
                    .claim("userId", user.getId())
                    .claim("scope", scope)
                    .build();

            JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
            SignedJWT signedJWT = new SignedJWT(header, claimsSet);

            MACSigner signer = new MACSigner(jwtProperties.getSignerKey().getBytes(StandardCharsets.UTF_8));
            signedJWT.sign(signer);

            String token = signedJWT.serialize();
            log.debug("Generated access token for user: {} with scope: {}", user.getEmail(), scope);
            return token;

        } catch (JOSEException e) {
            log.error("Failed to generate access token for user: {}", user.getEmail(), e);
            throw new RuntimeException("Could not generate access token", e);
        }
    }

    /**
     * Builds the scope claim: space-separated role strings, each prefixed with ROLE_
     * Example: "ROLE_STUDENT" or "ROLE_ADMIN ROLE_INSTRUCTOR"
     */
    private String buildScope(User user) {
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            return "ROLE_STUDENT";
        }
        return user.getRoles().stream()
                .map(role -> {
                    String name = role.getName().toUpperCase();
                    return name.startsWith("ROLE_") ? name : "ROLE_" + name;
                })
                .collect(Collectors.joining(" "));
    }
}
