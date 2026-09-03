package com.example.Elearning.security;

import com.example.Elearning.exception.ErrorCode;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerMapping;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

import java.io.IOException;
import java.util.List;

/**
 * Smart 401 handler that distinguishes between:
 * - Route not found (no handler registered) → 404 JSON
 * - Route exists but request is unauthenticated → 401 JSON
 *
 * This prevents leaking information about protected routes by returning
 * the same 401 for non-existent and protected routes.
 *
 * Uses ObjectProvider<List<HandlerMapping>> for lazy injection to avoid circular dependency.
 */
@Slf4j
@Component
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectProvider<List<HandlerMapping>> handlerMappingsProvider;

    public JwtAuthenticationEntryPoint(ObjectProvider<List<HandlerMapping>> handlerMappingsProvider) {
        this.handlerMappingsProvider = handlerMappingsProvider;
    }

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {

        boolean routeExists = isRouteRegistered(request);

        if (!routeExists) {
            log.debug("Route not found: {} {}", request.getMethod(), request.getRequestURI());
            SecurityResponseUtil.writeErrorResponse(response, ErrorCode.ROUTE_NOT_FOUND);
        } else {
            log.debug("Unauthenticated access to: {} {}", request.getMethod(), request.getRequestURI());
            SecurityResponseUtil.writeErrorResponse(response, ErrorCode.AUTHENTICATION_FAILED);
        }
    }

    /**
     * Checks if any RequestMappingHandlerMapping has a registered handler for this request.
     */
    private boolean isRouteRegistered(HttpServletRequest request) {
        List<HandlerMapping> handlerMappings = handlerMappingsProvider.getIfAvailable(List::of);

        for (HandlerMapping mapping : handlerMappings) {
            if (!(mapping instanceof RequestMappingHandlerMapping)) {
                continue;
            }
            try {
                if (mapping.getHandler(request) != null) {
                    return true;
                }
            } catch (Exception ignored) {
                // No handler matched via this mapping — continue checking others
            }
        }
        return false;
    }
}
