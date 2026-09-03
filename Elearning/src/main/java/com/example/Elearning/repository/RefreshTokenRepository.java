package com.example.Elearning.repository;

import com.example.Elearning.entity.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {

    Optional<RefreshToken> findByToken(String token);

    List<RefreshToken> findByUsernameAndRevokedFalse(String username);

    /** Bulk-revoke all active tokens for a user (used during reuse-attack or password reset). */
    @Modifying
    @Query("UPDATE RefreshToken rt SET rt.revoked = true WHERE rt.username = :username AND rt.revoked = false")
    void revokeAllByUsername(String username);
}
