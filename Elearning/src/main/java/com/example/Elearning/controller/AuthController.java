package com.example.Elearning.controller;

import com.example.Elearning.dto.ApiResponse;
import com.example.Elearning.dto.request.LoginRequest;
import com.example.Elearning.dto.request.LogoutRequest;
import com.example.Elearning.dto.request.RefreshTokenRequest;
import com.example.Elearning.dto.request.RegisterRequest;
import com.example.Elearning.dto.response.AuthResponse;
import com.example.Elearning.exception.AppException;
import com.example.Elearning.exception.AuthException;
import com.example.Elearning.exception.ErrorCode;
import com.example.Elearning.exception.SuccessCode;
import com.example.Elearning.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Authentication endpoints.
 *
 * All paths under /api/auth/** are publicly accessible (no token required).
 *
 * POST /api/auth/login          — email + password → access token + refresh token
 * POST /api/auth/register       — new account registration
 * POST /api/auth/refresh        — rotate refresh token → new access + refresh token pair
 * POST /api/auth/logout         — revoke refresh token
 * GET  /api/auth/health         — liveness check
 */
@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*", maxAge = 3600)
public class AuthController {

    private final AuthService authService;

    // ─────────────────────────────────────────────────────────────────────────
    // Login
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        log.info("Login request for: {}", request.getEmail());
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (AuthException e) {
            log.warn("Login failed for {}: {}", request.getEmail(), e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(buildError(e.getMessage(), e.getCode()));
        } catch (Exception e) {
            log.error("Unexpected error during login", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(buildError("Lỗi hệ thống. Vui lòng thử lại!", "SERVER_ERROR"));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Register
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        log.info("Register request for: {}", request.getEmail());
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (AuthException e) {
            log.warn("Registration failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(buildError(e.getMessage(), e.getCode()));
        } catch (Exception e) {
            log.error("Unexpected error during registration", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(buildError("Lỗi hệ thống. Vui lòng thử lại!", "SERVER_ERROR"));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Refresh Token (rotation)
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        log.info("Token refresh request");
        try {
            AuthResponse response = authService.refreshToken(request.getRefreshToken());
            return ResponseEntity.ok(response);
        } catch (AppException e) {
            log.warn("Token refresh failed: {}", e.getMessage());
            return ResponseEntity.status(e.getErrorCode().getHttpStatus())
                    .body(ApiResponse.error(e.getErrorCode()));
        } catch (Exception e) {
            log.error("Unexpected error during token refresh", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(buildError("Lỗi hệ thống. Vui lòng thử lại!", "SERVER_ERROR"));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Logout
    // ─────────────────────────────────────────────────────────────────────────

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@Valid @RequestBody LogoutRequest request) {
        log.info("Logout request");
        try {
            authService.logout(request.getRefreshToken());
            return ResponseEntity.ok(buildSuccess("Đăng xuất thành công"));
        } catch (AppException e) {
            // Token not found or already revoked — treat as successful logout
            log.warn("Logout with invalid/revoked token: {}", e.getMessage());
            return ResponseEntity.ok(buildSuccess("Đăng xuất thành công"));
        } catch (Exception e) {
            log.error("Unexpected error during logout", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(buildError("Lỗi hệ thống. Vui lòng thử lại!", "SERVER_ERROR"));
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Health check
    // ─────────────────────────────────────────────────────────────────────────

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "Authentication service is running");
        return ResponseEntity.ok(response);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private Map<String, Object> buildError(String message, String code) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        response.put("code", code);
        return response;
    }

    private Map<String, Object> buildSuccess(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", message);
        return response;
    }
}
