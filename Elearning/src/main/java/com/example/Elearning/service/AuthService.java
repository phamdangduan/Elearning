package com.example.Elearning.service;

import com.example.Elearning.dto.request.LoginRequest;
import com.example.Elearning.dto.request.RegisterRequest;
import com.example.Elearning.dto.response.AuthResponse;
import com.example.Elearning.entity.Profile;
import com.example.Elearning.entity.RefreshToken;
import com.example.Elearning.entity.Role;
import com.example.Elearning.entity.User;
import com.example.Elearning.enums.UserStatus;
import com.example.Elearning.exception.AppException;
import com.example.Elearning.exception.AuthException;
import com.example.Elearning.exception.ErrorCode;
import com.example.Elearning.repository.ProfileRepository;
import com.example.Elearning.repository.RoleRepository;
import com.example.Elearning.repository.UserRepository;
import com.example.Elearning.utils.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ProfileRepository profileRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;

    // ─────────────────────────────────────────────────────────────────────────
    // Login
    // ─────────────────────────────────────────────────────────────────────────

    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AuthException("Email hoặc mật khẩu không chính xác", "INVALID_CREDENTIALS"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AuthException("Email hoặc mật khẩu không chính xác", "INVALID_CREDENTIALS");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AuthException("Tài khoản đã bị khóa hoặc bị vô hiệu hóa", "ACCOUNT_LOCKED");
        }

        String accessToken  = jwtUtil.generateAccessToken(user);
        String refreshToken = refreshTokenService.createRefreshToken(user.getEmail());
        String role         = getPrimaryRole(user);
        String fullName     = resolveFullName(user);

        log.info("Login successful: {} ({})", request.getEmail(), role);

        return AuthResponse.builder()
                .userId(user.getId())
                .token(accessToken)
                .refreshToken(refreshToken)
                .role(role)
                .email(user.getEmail())
                .name(fullName)
                .success(true)
                .message("Đăng nhập thành công")
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Register
    // ─────────────────────────────────────────────────────────────────────────

    public AuthResponse register(RegisterRequest request) {
        log.info("Register attempt for: {}", request.getEmail());

        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new AuthException("Mật khẩu xác nhận không khớp", "PASSWORD_MISMATCH");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AuthException("Email đã được sử dụng", "EMAIL_ALREADY_EXISTS");
        }

        String roleName = request.getRole().toUpperCase();
        Role userRole = roleRepository.findByName(roleName)
                .orElseThrow(() -> new AuthException("Vai trò không hợp lệ: " + roleName, "INVALID_ROLE"));

        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setEmail(request.getEmail());
        user.setUserName(generateUserName(request.getEmail()));
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setStatus(UserStatus.ACTIVE);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        user.setRoles(new HashSet<>(Set.of(userRole)));

        User savedUser = userRepository.save(user);

        Profile profile = Profile.builder()
                .profileId(UUID.randomUUID().toString())
                .userId(savedUser.getId())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .fullName(request.getFirstName() + " " + request.getLastName())
                .phone(request.getPhone())
                .avatar("https://ui-avatars.com/api/?name="
                        + request.getFirstName() + "+" + request.getLastName()
                        + "&background=4F46E5&color=fff")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        profileRepository.save(profile);

        String accessToken  = jwtUtil.generateAccessToken(savedUser);
        String refreshToken = refreshTokenService.createRefreshToken(savedUser.getEmail());

        log.info("Register successful: {} ({})", request.getEmail(), roleName);

        return AuthResponse.builder()
                .userId(savedUser.getId())
                .token(accessToken)
                .refreshToken(refreshToken)
                .role(roleName)
                .email(savedUser.getEmail())
                .name(request.getFirstName() + " " + request.getLastName())
                .success(true)
                .message("Đăng ký thành công")
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Refresh Token (with Rotation)
    // ─────────────────────────────────────────────────────────────────────────

    public AuthResponse refreshToken(String tokenStr) {
        log.info("Token refresh attempt");

        // Verify includes reuse-attack detection
        RefreshToken oldToken = refreshTokenService.verifyRefreshToken(tokenStr);

        // Rotate: revoke old, issue new
        refreshTokenService.revokeToken(oldToken);

        User user = userRepository.findByEmail(oldToken.getUsername())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        String newAccessToken  = jwtUtil.generateAccessToken(user);
        String newRefreshToken = refreshTokenService.createRefreshToken(user.getEmail());

        log.info("Token rotated for: {}", user.getEmail());

        return AuthResponse.builder()
                .userId(user.getId())
                .token(newAccessToken)
                .refreshToken(newRefreshToken)
                .role(getPrimaryRole(user))
                .email(user.getEmail())
                .success(true)
                .message("Token đã được làm mới")
                .build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Logout
    // ─────────────────────────────────────────────────────────────────────────

    public void logout(String tokenStr) {
        RefreshToken token = refreshTokenService.verifyRefreshToken(tokenStr);
        refreshTokenService.revokeToken(token);
        log.info("User logged out: {}", token.getUsername());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Change Password (revokes all tokens to force re-login on all devices)
    // ─────────────────────────────────────────────────────────────────────────

    public void changePassword(String userId, String oldPassword, String newPassword) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new AppException(ErrorCode.PASSWORD_INVALID);
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Revoke all refresh tokens — force re-login on all devices
        refreshTokenService.revokeAllTokensForUser(user.getEmail());
        log.info("Password changed and all sessions revoked for: {}", user.getEmail());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private String getPrimaryRole(User user) {
        if (user.getRoles() == null || user.getRoles().isEmpty()) return "STUDENT";
        return user.getRoles().stream()
                .map(Role::getName)
                .findFirst()
                .orElse("STUDENT")
                .toUpperCase();
    }

    private String resolveFullName(User user) {
        if (user.getProfile() != null) {
            return user.getProfile().getFirstName() + " " + user.getProfile().getLastName();
        }
        return user.getUserName();
    }

    private String generateUserName(String email) {
        String base = email.substring(0, email.indexOf('@'));
        String candidate = base;
        int counter = 1;
        while (userRepository.existsByUserName(candidate)) {
            candidate = base + counter++;
        }
        return candidate;
    }
}
