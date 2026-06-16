package com.example.Elearning.security;

import com.example.Elearning.utils.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            String jwt = getJwtFromRequest(request);

            if (StringUtils.hasText(jwt) && jwtUtil.validateToken(jwt)) {
                String email = jwtUtil.getEmailFromToken(jwt);
                String role = jwtUtil.getRoleFromToken(jwt);

                // Log for debugging
                logger.info("JWT Filter - Email: " + email + ", Role from token: " + role);

                // Spring Security convention: prefix role with ROLE_ if it doesn't have it
                String authorityRole = role;
                if (!authorityRole.startsWith("ROLE_")) {
                    authorityRole = "ROLE_" + role;
                }

                logger.info("JWT Filter - Authority role set: " + authorityRole);

                List<GrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(authorityRole));

                // Create Authentication token
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        email, null, authorities);
                
                // Add request details
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // Set Authentication to SecurityContext
                SecurityContextHolder.getContext().setAuthentication(authentication);
                
                logger.info("JWT Filter - Authentication set successfully for: " + email);
            } else {
                logger.warn("JWT Filter - No valid JWT token found in request to: " + request.getRequestURI());
            }
        } catch (Exception ex) {
            logger.error("Could not set user authentication in security context", ex);
        }

        filterChain.doFilter(request, response);
    }

    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
