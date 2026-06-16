package com.example.Elearning.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AuthResponse {
    private String userId;
    private String token;
    private String refreshToken;
    private String role;
    private String name;
    private String email;
    private String message;
    private boolean success;
}
