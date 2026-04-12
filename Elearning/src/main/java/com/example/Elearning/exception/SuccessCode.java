package com.example.Elearning.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@AllArgsConstructor
@Getter
public enum SuccessCode {

    GET_MY_COURSE_SUCCESS(200, "Get all my course success", HttpStatus.OK),
    GET_COURSE_PUBLISH_SUCCESS(200, "Get all course publish success", HttpStatus.OK),
    UPLOAD_SUCCESS(200, "Upload success", HttpStatus.OK),
    GET_COURSE_DETAIL_SUCCESS(200, "Get course detail success", HttpStatus.OK),
    CREATED_COURSE(201, "Created course", HttpStatus.CREATED),
    UPDATED_COURSE(202, "Updated course", HttpStatus.OK),
    DELETED_COURSE(203, "Deleted course", HttpStatus.OK),
    CREATED_SECTION(204, "Created section", HttpStatus.CREATED),
    UPDATED_SECTION(205, "Updated section", HttpStatus.OK),
    DELETED_SECTION(206, "Deleted section", HttpStatus.OK),
    CREATED_LESSON(207, "Created lesson", HttpStatus.CREATED),
    UPDATED_LESSON(208, "Updated lesson", HttpStatus.OK),
    DELETED_LESSON(209, "Deleted lesson", HttpStatus.OK),
    GET_MY_COURSE_PUBLISHES(210, "Get all my course publishes", HttpStatus.OK),
    GET_COURSE_SUCCESS(211, "Get course success", HttpStatus.OK),
    ENROLLMENT_SUCCESS(200, "Enrollment success", HttpStatus.OK),
    GET_MY_ENROLLMENT_SUCCESS(200, "Get my enrollment success", HttpStatus.OK),
    COMPLETE_LESSON_SUCCESS(200, "Complete lesson success", HttpStatus.OK),
    GET_COURSE_PROGRESS_SUCCESS(200, "Get course progress success", HttpStatus.OK),
    REVIEW_CREATED(200, "Review created successfully", HttpStatus.OK),
    GET_REVIEWS_SUCCESS(200, "Get reviews successfully", HttpStatus.OK),
    PROFILE_UPDATED(200, "Profile updated successfully", HttpStatus.OK),
    AVATAR_UPDATED(200, "Avatar updated successfully", HttpStatus.OK),
    GET_PROFILE_SUCCESS(200, "Get profile successfully", HttpStatus.OK),
    DELETE_ALL_SUCCESS(200, "Delete all success", HttpStatus.OK),
    GET_CATEGORY_SUCCESS(200, "Get category success", HttpStatus.OK),
    CATEGORY_CREATED(200, "Create category success", HttpStatus.OK),
    CATEGORY_UPDATED(200, "Update category success", HttpStatus.OK),
    DELETED_CATEGORY(200,"Delete category success",HttpStatus.OK),
    BANK_ACCOUNT_CREATED(2001, "Bank account created successfully", HttpStatus.CREATED),
    BANK_ACCOUNT_UPDATED(2002, "Bank account updated successfully", HttpStatus.OK),
    BANK_ACCOUNT_DELETED(2003, "Bank account deleted successfully", HttpStatus.OK),
    GET_BANK_ACCOUNTS_SUCCESS(2004, "Get bank accounts successfully", HttpStatus.OK),
    GET_BANK_ACCOUNT_SUCCESS(2005, "Get bank account successfully", HttpStatus.OK),

    PAYMENT_REQUEST_CREATED(3001, "Payment request created successfully", HttpStatus.CREATED),
    PAYMENT_PROOF_UPLOADED(3002, "Payment proof uploaded successfully", HttpStatus.OK),
    PAYMENT_CANCELLED(3003, "Payment request cancelled successfully", HttpStatus.OK),
    PAYMENT_CONFIRMED(3004, "Payment confirmed and enrollment created successfully", HttpStatus.OK),
    PAYMENT_REJECTED(3005, "Payment request rejected", HttpStatus.OK),
    GET_PAYMENT_REQUESTS_SUCCESS(3006, "Get payment requests successfully", HttpStatus.OK),
    GET_PAYMENT_DETAIL_SUCCESS(3007, "Get payment detail successfully", HttpStatus.OK),
    GET_PAYMENT_INFO_SUCCESS(3008, "Get payment info successfully", HttpStatus.OK),

    // Notification Success Codes (4001-4010)
    GET_NOTIFICATIONS_SUCCESS(4001, "Lấy danh sách thông báo thành công",HttpStatus.OK),
    NOTIFICATION_MARKED_READ(4002, "Đánh dấu đã đọc thành công",HttpStatus.OK),
    NOTIFICATION_CREATED(4003, "Tạo thông báo thành công",HttpStatus.OK),

    GET_INSTRUCTOR_STATS_SUCCESS(5001, "Get instructor statistics successfully", HttpStatus.OK),

    GET_STUDENT_STATS_SUCCESS(6001, "Get student statistics successfully", HttpStatus.OK),

    FILE_UPLOADED(200, "File uploaded successfully", HttpStatus.OK),


    ;


    private final int status;
    private final String message;
    private final HttpStatus httpStatus;
}
