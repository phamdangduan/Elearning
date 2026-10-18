package com.example.Elearning.enums;

/** Loại bút toán trong sổ cái ví giảng viên. */
public enum WalletTransactionType {
    SALE_CREDIT,        // Cộng doanh thu từ một đơn bán khóa học
    SALE_RELEASE,       // Hết thời gian tạm giữ: pending → available
    WITHDRAW_HOLD,      // Tạo yêu cầu rút: available → locked
    WITHDRAW_RELEASE,   // Yêu cầu rút bị từ chối/hủy: locked → available
    WITHDRAW_COMPLETE   // Admin đã chuyển tiền: trừ vĩnh viễn locked
}
