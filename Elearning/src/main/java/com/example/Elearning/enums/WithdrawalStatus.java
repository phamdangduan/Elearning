package com.example.Elearning.enums;

public enum WithdrawalStatus {
    PENDING,    // Chờ admin chuyển tiền
    APPROVED,   // Admin đã chuyển tiền và xác nhận
    REJECTED,   // Admin từ chối, tiền trả lại số dư khả dụng
    CANCELLED   // Giảng viên tự hủy
}
