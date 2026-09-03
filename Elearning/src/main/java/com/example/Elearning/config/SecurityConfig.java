package com.example.Elearning.config;

import com.example.Elearning.security.CustomAccessDeniedHandler;
import com.example.Elearning.security.CustomJwtDecoder;
import com.example.Elearning.security.JwtAuthConverter;
import com.example.Elearning.security.JwtAuthenticationEntryPoint;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Spring Security configuration.
 *
 * Authentication strategy: OAuth2 Resource Server with custom JWT decoder (HS512).
 * No manual JwtAuthenticationFilter — Spring Security handles token extraction
 * and SecurityContext population automatically via the resource server setup.
 *
 * Authorization strategy:
 *  - Public endpoints: permitted without token
 *  - Role-based endpoints: ROLE_STUDENT, ROLE_INSTRUCTOR, ROLE_TEACHER, ROLE_ADMIN
 *  - All other requests: must be authenticated
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomJwtDecoder customJwtDecoder;
    private final JwtAuthConverter jwtAuthConverter;
    private final JwtAuthenticationEntryPoint authenticationEntryPoint;
    private final CustomAccessDeniedHandler accessDeniedHandler;

    // ─────────────────────────────────────────────────────────────────────────
    // Password Encoder
    // ─────────────────────────────────────────────────────────────────────────

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CORS
    // ─────────────────────────────────────────────────────────────────────────

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Cache-Control", "Content-Type", "X-Requested-With"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Security Filter Chain
    // ─────────────────────────────────────────────────────────────────────────

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Stateless REST API — no CSRF, no session
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // Authorization rules
            .authorizeHttpRequests(auth -> auth

                // ── Public ─────────────────────────────────────────────────────────
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET,
                    "/category/**",
                    "/course/**",
                    "/profile/**",
                    "/section/course/**",
                    "/review/get-reviewsForCourse",
                    "/instructor/stats"
                ).permitAll()

                // ── Profile management (any authenticated user) ────────────────────
                .requestMatchers(HttpMethod.PUT,  "/profile/update").authenticated()
                .requestMatchers(HttpMethod.POST, "/profile/upload-avatar").authenticated()
                .requestMatchers(HttpMethod.POST, "/profile/change-password").authenticated()

                // ── Profile admin operations ───────────────────────────────────────
                .requestMatchers(HttpMethod.DELETE, "/profile/**").hasAuthority("ROLE_ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/profile/*/status").hasAuthority("ROLE_ADMIN")

                // ── Student endpoints ──────────────────────────────────────────────
                .requestMatchers("/student/**", "/lessonprogess/**").hasAuthority("ROLE_STUDENT")
                .requestMatchers("/enrollment/my-enrollment").hasAuthority("ROLE_STUDENT")
                .requestMatchers(HttpMethod.POST, "/enrollment").hasAuthority("ROLE_STUDENT")
                .requestMatchers("/enrollment/status").authenticated()

                // ── Instructor endpoints ───────────────────────────────────────────
                .requestMatchers("/enrollment/instructor-students").hasAnyAuthority("ROLE_INSTRUCTOR", "ROLE_TEACHER", "ROLE_ADMIN")
                .requestMatchers("/instructor/**").hasAnyAuthority("ROLE_INSTRUCTOR", "ROLE_TEACHER")

                // ── Course / Section / Lesson write operations ─────────────────────
                .requestMatchers(HttpMethod.POST,   "/course/**", "/section/**", "/lesson/**").hasAnyAuthority("ROLE_INSTRUCTOR", "ROLE_TEACHER")
                .requestMatchers(HttpMethod.PUT,    "/course/**", "/section/**", "/lesson/**").hasAnyAuthority("ROLE_INSTRUCTOR", "ROLE_TEACHER")
                .requestMatchers(HttpMethod.PATCH,  "/course/**", "/section/**", "/lesson/**").hasAnyAuthority("ROLE_INSTRUCTOR", "ROLE_TEACHER")
                .requestMatchers(HttpMethod.DELETE, "/course/**", "/section/**", "/lesson/**").hasAnyAuthority("ROLE_INSTRUCTOR", "ROLE_TEACHER")

                // ── Admin endpoints ────────────────────────────────────────────────
                .requestMatchers("/admin/**").hasAuthority("ROLE_ADMIN")

                // ── Payment requests ───────────────────────────────────────────────
                .requestMatchers("/payment-requests/**").hasAnyAuthority("ROLE_STUDENT", "ROLE_ADMIN", "ROLE_TEACHER", "ROLE_INSTRUCTOR")

                // ── Everything else requires authentication ────────────────────────
                .anyRequest().authenticated()
            )

            // OAuth2 Resource Server — JWT via custom decoder + converter
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .decoder(customJwtDecoder)
                    .jwtAuthenticationConverter(jwtAuthConverter)
                )
                .authenticationEntryPoint(authenticationEntryPoint)
            )

            // Exception handling
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler)
            );

        return http.build();
    }
}
