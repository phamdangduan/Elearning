package com.example.Elearning.config;

import com.example.Elearning.security.JwtAuthenticationFilter;
import com.example.Elearning.repository.UserRepository;
import com.example.Elearning.dto.ApiResponse;
import com.example.Elearning.exception.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
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
    private final UserRepository userRepository;

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
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(exception -> exception
                .authenticationEntryPoint(customAuthenticationEntryPoint())
                .accessDeniedHandler(customAccessDeniedHandler())
            )
            .authenticationProvider(authenticationProvider());
            
        return http.build();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return email -> userRepository.findByEmail(email)
                .map(com.example.Elearning.security.CustomUserDetails::new)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng với email: " + email));
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService());
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationEntryPoint customAuthenticationEntryPoint() {
        return (request, response, authException) -> {
            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            
            ObjectMapper mapper = new ObjectMapper();
            ApiResponse<Object> apiResponse = ApiResponse.error(ErrorCode.AUTHENTICATION_FAILED);
            response.getWriter().write(mapper.writeValueAsString(apiResponse));
        };
    }

    @Bean
    public AccessDeniedHandler customAccessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            response.setContentType("application/json;charset=UTF-8");
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            
            ObjectMapper mapper = new ObjectMapper();
            ApiResponse<Object> apiResponse = ApiResponse.error(ErrorCode.UNAUTHORIZED);
            response.getWriter().write(mapper.writeValueAsString(apiResponse));
        };
    }
}
