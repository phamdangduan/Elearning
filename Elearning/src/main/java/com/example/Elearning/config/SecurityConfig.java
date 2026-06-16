package com.example.Elearning.config;

import com.example.Elearning.security.JwtAuthenticationFilter;
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
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*")); // Changed from setAllowedOrigins to support credentials
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("Authorization", "Cache-Control", "Content-Type", "X-Requested-With"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true); // Enable credentials
        config.setMaxAge(3600L); // Cache preflight response for 1 hour
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(Customizer.withDefaults())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/**", "/api/debug/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/category/**", "/course/**", "/profile/**", "/section/course/**", "/review/get-reviewsForCourse", "/instructor/stats").permitAll()
                
                // Profile management - authenticated users can update their own profile
                .requestMatchers(HttpMethod.PUT, "/profile/update").authenticated()
                .requestMatchers(HttpMethod.POST, "/profile/upload-avatar").authenticated()
                
                // Profile admin operations - only ADMIN can delete users and change status
                .requestMatchers(HttpMethod.DELETE, "/profile/**").hasAuthority("ROLE_ADMIN")
                .requestMatchers(HttpMethod.PATCH, "/profile/*/status").hasAuthority("ROLE_ADMIN")
                
                // Instructor enrollment endpoints
                .requestMatchers("/enrollment/instructor-students").hasAnyAuthority("ROLE_INSTRUCTOR", "ROLE_TEACHER", "ROLE_ADMIN")
                
                // Student endpoints
                .requestMatchers("/student/**", "/enrollment/**", "/lessonprogess/**").hasAuthority("ROLE_STUDENT")
                
                // Instructor endpoints
                .requestMatchers("/instructor/**").hasAnyAuthority("ROLE_INSTRUCTOR", "ROLE_TEACHER")
                
                // Course, Section, Lesson management
                .requestMatchers(HttpMethod.POST, "/course/**", "/section/**", "/lesson/**").hasAnyAuthority("ROLE_INSTRUCTOR", "ROLE_TEACHER")
                .requestMatchers(HttpMethod.PUT, "/course/**", "/section/**", "/lesson/**").hasAnyAuthority("ROLE_INSTRUCTOR", "ROLE_TEACHER")
                .requestMatchers(HttpMethod.PATCH, "/course/**", "/section/**", "/lesson/**").hasAnyAuthority("ROLE_INSTRUCTOR", "ROLE_TEACHER")
                .requestMatchers(HttpMethod.DELETE, "/course/**", "/section/**", "/lesson/**").hasAnyAuthority("ROLE_INSTRUCTOR", "ROLE_TEACHER")
                
                // Admin endpoints
                .requestMatchers("/admin/**").hasAuthority("ROLE_ADMIN")
                
                // Payment requests
                .requestMatchers("/payment-requests/**").hasAnyAuthority("ROLE_STUDENT", "ROLE_ADMIN", "ROLE_TEACHER", "ROLE_INSTRUCTOR")
                
                // All other requests require authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
            
        return http.build();
    }
}
