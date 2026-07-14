package com.example.Elearning.service;

import com.example.Elearning.dto.request.LoginRequest;
import com.example.Elearning.dto.response.AuthResponse;
import com.example.Elearning.entity.Role;
import com.example.Elearning.entity.User;
import com.example.Elearning.enums.UserStatus;
import com.example.Elearning.exception.AuthException;
import com.example.Elearning.repository.ProfileRepository;
import com.example.Elearning.repository.RoleRepository;
import com.example.Elearning.repository.UserRepository;
import com.example.Elearning.utils.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Collections;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private ProfileRepository profileRepository;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private AuthService authService;

    private User mockUser;
    private Role mockRole;

    @BeforeEach
    void setUp() {
        mockRole = new Role();
        mockRole.setName("STUDENT");

        mockUser = new User();
        mockUser.setId("user-123");
        mockUser.setEmail("test@example.com");
        mockUser.setUserName("testuser");
        mockUser.setPasswordHash("encoded_password");
        mockUser.setStatus(UserStatus.ACTIVE);
        mockUser.setRoles(Collections.singleton(mockRole));
    }

    @Test
    void login_Success() {
        // Arrange (Chuẩn bị dữ liệu và định nghĩa giả lập Mock)
        LoginRequest request = new LoginRequest("test@example.com", "password123", false);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("password123", "encoded_password")).thenReturn(true);
        when(jwtUtil.generateToken(anyString(), anyString(), anyString())).thenReturn("mock_access_token");
        when(jwtUtil.generateRefreshToken(anyString())).thenReturn("mock_refresh_token");

        // Act (Gọi phương thức nghiệp vụ thực tế)
        AuthResponse response = authService.login(request);

        // Assert (So sánh kết quả đầu ra với mong đợi)
        assertNotNull(response);
        assertTrue(response.isSuccess());
        assertEquals("mock_access_token", response.getToken());
        assertEquals("mock_refresh_token", response.getRefreshToken());
        assertEquals("test@example.com", response.getEmail());
        assertEquals("STUDENT", response.getRole());
    }

    @Test
    void login_WrongPassword_ThrowsException() {
        // Arrange (Mật khẩu nhập sai)
        LoginRequest request = new LoginRequest("test@example.com", "wrong_password", false);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(mockUser));
        when(passwordEncoder.matches("wrong_password", "encoded_password")).thenReturn(false);

        // Act & Assert (Gọi hàm và kiểm tra xem có ném ra đúng Exception hay không)
        AuthException exception = assertThrows(AuthException.class, () -> authService.login(request));
        assertEquals("Email hoặc mật khẩu không chính xác", exception.getMessage());
        assertEquals("INVALID_CREDENTIALS", exception.getCode());
    }

    @Test
    void login_LockedUser_ThrowsException() {
        // Arrange (Người dùng bị khóa tài khoản)
        mockUser.setStatus(UserStatus.LOCKED);
        LoginRequest request = new LoginRequest("test@example.com", "password123", false);

        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(mockUser));

        // Act & Assert (Gọi hàm và kiểm tra xem có ném ra đúng lỗi khóa tài khoản)
        AuthException exception = assertThrows(AuthException.class, () -> authService.login(request));
        assertEquals("Tài khoản đã bị khóa", exception.getMessage());
        assertEquals("ACCOUNT_LOCKED", exception.getCode());
    }
}
