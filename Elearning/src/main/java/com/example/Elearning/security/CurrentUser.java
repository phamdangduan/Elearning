package com.example.Elearning.security;

import com.example.Elearning.exception.AppException;
import com.example.Elearning.exception.ErrorCode;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

/**
 * Lấy thông tin người dùng hiện tại từ JWT đã được Spring Security xác thực.
 *
 * Controller KHÔNG được tin userId/instructorId/studentId do client gửi lên,
 * vì client có thể sửa thành id của người khác (IDOR).
 * Claim "userId" được JwtUtil ghi vào token lúc đăng nhập.
 */
public final class CurrentUser {

    private CurrentUser() {
    }

    /** userId trong token. Ném 401 nếu request chưa đăng nhập. */
    public static String getUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof JwtAuthenticationToken jwtAuth) {
            String userId = jwtAuth.getToken().getClaimAsString("userId");
            if (userId != null && !userId.isBlank()) {
                return userId;
            }
        }
        throw new AppException(ErrorCode.AUTHENTICATION_FAILED);
    }

    public static boolean isAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    /**
     * Chọn userId để xử lý request:
     * - ADMIN được chỉ định userId khác qua tham số (để quản trị).
     * - Người dùng thường luôn dùng userId trong token, bỏ qua tham số client gửi.
     */
    public static String resolve(String requestedUserId) {
        if (requestedUserId != null && !requestedUserId.isBlank() && isAdmin()) {
            return requestedUserId;
        }
        return getUserId();
    }
}
