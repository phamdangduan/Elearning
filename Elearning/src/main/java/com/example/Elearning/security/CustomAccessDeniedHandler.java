package com.example.Elearning.security;

import com.example.Elearning.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Returns a consistent 403 JSON response when an authenticated user
 * attempts to access a resource they are not authorized for.
 */
@Slf4j
@Component
public class CustomAccessDeniedHandler implements AccessDeniedHandler {

    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {
        log.debug("Access denied to: {} {} — {}", request.getMethod(), request.getRequestURI(), accessDeniedException.getMessage());
        SecurityResponseUtil.writeErrorResponse(response, ErrorCode.UNAUTHORIZED);
    }
}
