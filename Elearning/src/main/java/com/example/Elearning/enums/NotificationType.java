package com.example.Elearning.enums;

public enum NotificationType {
    PAYMENT_CONFIRMED,       // Payment đã được xác nhận
    PAYMENT_REJECTED,        // Payment bị từ chối
    PAYMENT_EXPIRED,         // Payment hết hạn
    PAYMENT_PROOF_UPLOADED,  // Student đã upload bill (luồng cũ)
    COURSE_SOLD,             // Giảng viên bán được khóa học, doanh thu đã vào ví
    WITHDRAWAL_APPROVED,     // Yêu cầu rút tiền đã được chi
    WITHDRAWAL_REJECTED      // Yêu cầu rút tiền bị từ chối
}
