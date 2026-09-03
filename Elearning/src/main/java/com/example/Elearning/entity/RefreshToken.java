package com.example.Elearning.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

/**
 * Stores refresh tokens in DB for rotation + reuse detection.
 * A refresh token is a random UUID string (NOT a JWT).
 * Each refresh call revokes the old token and issues a new one (rotation).
 * If a revoked token is used again => reuse attack => revoke all user tokens.
 */
@Entity
@Table(
    name = "refresh_tokens",
    indexes = {
        @Index(name = "idx_refresh_token_username", columnList = "username"),
        @Index(name = "idx_refresh_token_revoked",  columnList = "revoked")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RefreshToken implements Serializable {

    @Id
    @Column(name = "id", length = 36, nullable = false, updatable = false)
    @Builder.Default
    String id = UUID.randomUUID().toString();

    /** The actual token value returned to the client — random UUID string. */
    @Column(name = "token", length = 36, nullable = false, unique = true, updatable = false)
    @Builder.Default
    String token = UUID.randomUUID().toString();

    /** The email (username) that owns this token. */
    @Column(name = "username", nullable = false)
    String username;

    /** Token expiry timestamp. */
    @Column(name = "expiry_time", nullable = false)
    Instant expiryTime;

    /**
     * When true, this token has been consumed or invalidated.
     * Using a revoked token triggers reuse-attack detection.
     */
    @Column(name = "revoked", nullable = false)
    @Builder.Default
    boolean revoked = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    Instant createdAt = Instant.now();
}
