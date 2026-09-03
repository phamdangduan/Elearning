package com.example.Elearning.security;

import com.example.Elearning.dto.ApiResponse;
import com.example.Elearning.exception.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * Shared static utility for writing JSON error responses in security handlers.
 * Used by JwtAuthenticationEntryPoint (401/404) and CustomAccessDeniedHandler (403).
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class SecurityResponseUtil {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    /**
     * Writes a JSON error response with the HTTP status from the given ErrorCode.
     *
     * @param response  the HttpServletResponse to write to
     * @param errorCode the error code containing HTTP status and message
     */
    public static void writeErrorResponse(HttpServletResponse response, ErrorCode errorCode) throws IOException {
        response.setStatus(errorCode.getHttpStatus().value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());

        ApiResponse<Object> body = ApiResponse.error(errorCode);
        response.getWriter().write(OBJECT_MAPPER.writeValueAsString(body));
    }
}
