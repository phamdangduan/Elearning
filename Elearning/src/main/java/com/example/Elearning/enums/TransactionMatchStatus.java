package com.example.Elearning.enums;

/** Kết quả đối soát một giao dịch ngân hàng nhận từ webhook. */
public enum TransactionMatchStatus {
    MATCHED,        // Khớp đơn và đã xác nhận thanh toán
    UNMATCHED,      // Không tìm thấy mã đối soát / đơn hàng
    UNDERPAID,      // Chuyển thiếu tiền
    DUPLICATE,      // Đơn đã thanh toán trước đó / học viên đã sở hữu khóa — cần hoàn tiền
    IGNORED         // Giao dịch tiền ra, hoặc không phải tài khoản của sàn
}
