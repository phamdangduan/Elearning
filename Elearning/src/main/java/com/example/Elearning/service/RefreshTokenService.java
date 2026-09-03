package com.example.Elearning.service;

import com.example.Elearning.entity.RefreshToken;

public interface RefreshTokenService {

    /**
     * Creates a new refresh token for the given username and persists it to DB.
     *
     * @param username the user's email
     * @return the raw UUID token string to return to the client
     */
    String createRefreshToken(String username);

    /**
     * Verifies a refresh token.
     * <ol>
     *   <li>Not found            → throw AUTHENTICATION_FAILED</li>
     *   <li>revoked == true      → REUSE ATTACK: revoke all tokens for user, throw REFRESH_TOKEN_REVOKED</li>
     *   <li>expired              → throw AUTHENTICATION_FAILED</li>
     * </ol>
     *
     * @param tokenStr raw UUID string from client
     * @return the valid RefreshToken entity
     */
    RefreshToken verifyRefreshToken(String tokenStr);

    /**
     * Marks a single token as revoked (used on logout or token rotation).
     */
    void revokeToken(RefreshToken refreshToken);

    /**
     * Marks all non-revoked tokens for a user as revoked.
     * Used when a reuse attack is detected or password is reset.
     */
    void revokeAllTokensForUser(String username);
}
