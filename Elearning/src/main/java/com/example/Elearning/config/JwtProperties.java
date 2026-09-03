package com.example.Elearning.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * JWT configuration properties.
 * Binds to application.yml: jwt.*
 * Override signer-key in production via environment variable: JWT_SIGNER_KEY
 */
@Component
@ConfigurationProperties(prefix = "jwt")
@Getter
@Setter
public class JwtProperties {

    /** HS512 signing key - must be at least 64 chars (512 bits). */
    private String signerKey;

    /** Access token lifetime in seconds. Default: 3600 (1 hour). */
    private long accessTokenExpiry = 3600;

    /** Refresh token lifetime in seconds. Default: 1209600 (14 days). */
    private long refreshTokenExpiry = 1209600;

    /** JWT issuer claim value. */
    private String issuer = "elearning-app";
}
