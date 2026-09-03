package com.example.Elearning.security;

import com.example.Elearning.config.JwtProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

/**
 * Custom JWT decoder using HS512 algorithm via Nimbus.
 * Wraps NimbusJwtDecoder with the application signing key.
 * Registered as a Spring bean so SecurityConfig can inject it.
 */
@Slf4j
@Component
public class CustomJwtDecoder implements JwtDecoder {

    private final NimbusJwtDecoder nimbusJwtDecoder;

    public CustomJwtDecoder(JwtProperties jwtProperties) {
        SecretKeySpec secretKey = new SecretKeySpec(
                jwtProperties.getSignerKey().getBytes(StandardCharsets.UTF_8),
                "HmacSHA512"
        );
        this.nimbusJwtDecoder = NimbusJwtDecoder
                .withSecretKey(secretKey)
                .macAlgorithm(org.springframework.security.oauth2.jose.jws.MacAlgorithm.HS512)
                .build();
    }

    @Override
    public Jwt decode(String token) throws JwtException {
        try {
            return nimbusJwtDecoder.decode(token);
        } catch (JwtException e) {
            log.warn("JWT decode failed: {}", e.getMessage());
            throw e;
        }
    }
}
