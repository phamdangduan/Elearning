package com.example.Elearning.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    VALIDATION_ERROR(100, "Validation error", HttpStatus.BAD_REQUEST),
    UNCATEGORIZED_EXCEPTION(101, "Uncategorized exception", HttpStatus.INTERNAL_SERVER_ERROR),

    AUTHENTICATION_FAILED(200, "Authentication failed", HttpStatus.UNAUTHORIZED),

    USER_NOT_FOUND(300, "User not found", HttpStatus.NOT_FOUND),
    USER_NOT_TEACHER(301, "User is not a teacher", HttpStatus.FORBIDDEN),
    UNAUTHORIZED(302, "Unauthorized access", HttpStatus.FORBIDDEN),

    COURSE_NOT_FOUND(400, "Course not found", HttpStatus.NOT_FOUND),
    SECTION_NOT_FOUND(401, "Section not found", HttpStatus.NOT_FOUND),
    LESSON_NOT_FOUND(402, "Lesson not found", HttpStatus.NOT_FOUND),
    REGISTERED(403, "Registered not found", HttpStatus.NOT_FOUND),

    CATEGORY_NOT_FOUND(500, "parent category not found", HttpStatus.NOT_FOUND),
    CATEGORY_NAME_EXISTED(501, "category name existed", HttpStatus.NOT_FOUND),
    PARENT_CATEGORY_NOT_FOUND(502, "parent category not found", HttpStatus.NOT_FOUND),
    CATEGORY_EXISTED(503, "Category already exists", HttpStatus.BAD_REQUEST),

    REVIEW_EXISTS(600, "You have already reviewed this course", HttpStatus.BAD_REQUEST),
    REVIEW_NOT_ENROLLED(601, "You must be enrolled in this course to review it", HttpStatus.FORBIDDEN),
    REVIEW_COURSE_NOT_COMPLETED(602, "You must complete the course before reviewing it", HttpStatus.FORBIDDEN),



    FILE_EMPTY(701, "File is empty", HttpStatus.BAD_REQUEST),
    FILE_TOO_LARGE(702, "File size exceeds maximum allowed size", HttpStatus.BAD_REQUEST),
    FILE_TYPE_NOT_ALLOWED(703, "File type is not allowed", HttpStatus.BAD_REQUEST),
    FILE_VALIDATION_FAILED(704, "File validation failed", HttpStatus.BAD_REQUEST),
    FILE_UPLOAD_FAILED(705, "Failed to upload file", HttpStatus.INTERNAL_SERVER_ERROR),
    FILE_DELETE_FAILED(706, "Failed to delete file", HttpStatus.INTERNAL_SERVER_ERROR),

    BANK_ACCOUNT_NOT_FOUND(800, "Bank account not found", HttpStatus.NOT_FOUND),
    BANK_ACCOUNT_ALREADY_EXISTS(801, "Bank account with this account number already exists", HttpStatus.BAD_REQUEST),
    PRIMARY_BANK_ACCOUNT_NOT_FOUND(802, "Primary bank account not found", HttpStatus.NOT_FOUND),
    CANNOT_DELETE_PRIMARY_BANK_ACCOUNT(803, "Cannot delete primary bank account when other accounts exist", HttpStatus.BAD_REQUEST),


    PAYMENT_REQUEST_NOT_FOUND(900, "Payment request not found", HttpStatus.NOT_FOUND),
    PAYMENT_ALREADY_EXISTS(901, "Payment request already exists for this course", HttpStatus.BAD_REQUEST),
    PAYMENT_ALREADY_CONFIRMED(902, "Payment request already confirmed", HttpStatus.BAD_REQUEST),
    PAYMENT_EXPIRED(903, "Payment request has expired", HttpStatus.BAD_REQUEST),
    PAYMENT_NOT_PENDING(904, "Payment request is not in pending status", HttpStatus.BAD_REQUEST),
    ALREADY_ENROLLED(905, "Already enrolled in this course", HttpStatus.BAD_REQUEST),
    COURSE_PRICE_ZERO(906, "Course is free, no payment required", HttpStatus.BAD_REQUEST),

    // Notification Error Codes (1000-1010)
    NOTIFICATION_NOT_FOUND(1000, "Không tìm thấy thông báo", HttpStatus.NOT_FOUND),

    PROFILE_NOT_FOUND(1100, "Profile not found", HttpStatus.NOT_FOUND),

    ;

    private final int status;
    private final String message;
    private final HttpStatus httpStatus;

    ErrorCode(int status, String message, HttpStatus httpStatus) {
        this.status = status;
        this.message = message;
        this.httpStatus = httpStatus;
    }
}

