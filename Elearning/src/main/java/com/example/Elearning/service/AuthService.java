package com.example.Elearning.service;

import com.example.Elearning.dto.request.LoginRequest;
import com.example.Elearning.dto.request.RegisterRequest;
import com.example.Elearning.dto.response.AuthResponse;
import com.example.Elearning.entity.Profile;
import com.example.Elearning.entity.Role;
import com.example.Elearning.entity.User;
import com.example.Elearning.enums.UserStatus;
import com.example.Elearning.exception.AuthException;
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

    /**
     * Login user
     */
    public AuthResponse login(LoginRequest request) {
        log.info("Attempting to login user with email: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new AuthException("Email hoặc mật khẩu không chính xác", "INVALID_CREDENTIALS"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new AuthException("Email hoặc mật khẩu không chính xác", "INVALID_CREDENTIALS");
        }

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AuthException("Tài khoản đã bị khóa", "ACCOUNT_LOCKED");
        }

        // Get user's role and normalize to uppercase
        String role = user.getRoles().stream()
                .map(Role::getName)
                .findFirst()
                .orElse("STUDENT");
        
        // Ensure role is uppercase
        role = role.toUpperCase();

        // Get user's name from profile or use userName
        String fullName = user.getUserName();
        if (user.getProfile() != null) {
            fullName = user.getProfile().getFirstName() + " " + user.getProfile().getLastName();
        }

        // Generate tokens with uppercase role
        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), role);
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());

        log.info("User {} logged in successfully with role {}", request.getEmail(), role);

        return AuthResponse.builder()
                .userId(user.getId())
                .token(token)
                .refreshToken(refreshToken)
                .role(role)
                .email(user.getEmail())
                .name(fullName)
                .success(true)
                .message("Đăng nhập thành công")
                .build();
    }

    /**
     * Register new user
     */
    public AuthResponse register(RegisterRequest request) {
        log.info("Attempting to register user with email: {}", request.getEmail());

        // Validate
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new AuthException("Mật khẩu xác nhận không khớp", "PASSWORD_MISMATCH");
        }

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new AuthException("Email đã được sử dụng", "EMAIL_ALREADY_EXISTS");
        }

        // Get or create role - ensure role name is uppercase
        String roleName = request.getRole().toUpperCase();
        Role userRole = roleRepository.findByName(roleName)
                .orElseThrow(() -> new AuthException("Vai trò không hợp lệ", "INVALID_ROLE"));

        // Create new user
        User user = new User();
        user.setId(UUID.randomUUID().toString());
        user.setEmail(request.getEmail());
        user.setUserName(generateUserName(request.getEmail()));
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setStatus(UserStatus.ACTIVE);
        user.setCreatedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());

        // Set roles
        Set<Role> roles = new HashSet<>();
        roles.add(userRole);
        user.setRoles(roles);

        // Save user
        User savedUser = userRepository.save(user);

        // Create profile for the new user
        Profile profile = Profile.builder()
                .profileId(UUID.randomUUID().toString())
                .userId(savedUser.getId())
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .fullName(request.getFirstName() + " " + request.getLastName())
                .phone(request.getPhone())
                .avatar("https://ui-avatars.com/api/?name=" + request.getFirstName() + "+" + request.getLastName() + "&background=4F46E5&color=fff")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        
        profileRepository.save(profile);

        log.info("User {} registered successfully with profile", request.getEmail());

        // Generate tokens - use uppercase role name
        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getEmail(), roleName);
        String refreshToken = jwtUtil.generateRefreshToken(savedUser.getId());

        return AuthResponse.builder()
                .userId(savedUser.getId())
                .token(token)
                .refreshToken(refreshToken)
                .role(roleName)
                .email(savedUser.getEmail())
                .name(request.getFirstName() + " " + request.getLastName())
                .success(true)
                .message("Đăng kí thành công")
                .build();
    }

    /**
     * Validate token
     */
    public boolean validateToken(String token) {
        return jwtUtil.validateToken(token);
    }

    /**
     * Get user ID from token
     */
    public String getUserIdFromToken(String token) {
        return jwtUtil.getUserIdFromToken(token);
    }

    /**
     * Refresh token
     */
    public AuthResponse refreshToken(String refreshToken) {
        log.info("Attempting to refresh token");

        if (!jwtUtil.validateToken(refreshToken)) {
            throw new AuthException("Refresh token không hợp lệ", "INVALID_REFRESH_TOKEN");
        }

        String userId = jwtUtil.getUserIdFromToken(refreshToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthException("Người dùng không tồn tại", "USER_NOT_FOUND"));

        // Get and normalize role to uppercase
        String role = user.getRoles().stream()
                .map(Role::getName)
                .findFirst()
                .orElse("STUDENT");
        
        role = role.toUpperCase();

        String newToken = jwtUtil.generateToken(user.getId(), user.getEmail(), role);
        String newRefreshToken = jwtUtil.generateRefreshToken(user.getId());

        return AuthResponse.builder()
                .userId(user.getId())
                .token(newToken)
                .refreshToken(newRefreshToken)
                .role(role)
                .email(user.getEmail())
                .success(true)
                .message("Token được làm mới")
                .build();
    }

    /**
     * Generate unique username from email
     */
    private String generateUserName(String email) {
        String baseUserName = email.substring(0, email.indexOf('@'));
        String userName = baseUserName;
        int counter = 1;

        while (userRepository.existsByUserName(userName)) {
            userName = baseUserName + counter;
            counter++;
        }

        return userName;
    }
}
