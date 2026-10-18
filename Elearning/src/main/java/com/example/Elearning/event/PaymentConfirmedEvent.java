package com.example.Elearning.event;

import java.math.BigDecimal;

/**
 * Phát ra khi một đơn được xác nhận thanh toán.
 * Mang sẵn dữ liệu cần dùng để listener chạy bất đồng bộ không phải đụng tới entity lazy.
 */
public record PaymentConfirmedEvent(
        String paymentRequestId,
        String studentId,
        String instructorId,
        String courseTitle,
        BigDecimal amount,
        BigDecimal instructorEarning,
        int holdDays
) {
}
