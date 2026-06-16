package com.example.Elearning.exception;

public class AuthException extends RuntimeException {
    private String code;

    public AuthException(String message) {
        super(message);
        this.code = "AUTH_ERROR";
    }

    public AuthException(String message, String code) {
        super(message);
        this.code = code;
    }

    public String getCode() {
        return code;
    }
}
