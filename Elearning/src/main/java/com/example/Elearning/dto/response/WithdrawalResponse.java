package com.example.Elearning.dto.response;

import com.example.Elearning.enums.WithdrawalStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WithdrawalResponse {
    String id;
    String code;
    String instructorId;
    String instructorName;
    String instructorEmail;
    BigDecimal amount;
    WithdrawalStatus status;
    String bankName;
    String accountNumber;
    String accountName;
    /** Ảnh QR giảng viên tự upload (chỉ tham khảo). */
    String qrCodeUrl;
    /** QR VietQR sinh động từ STK + số tiền + nội dung — admin nên quét mã này. */
    String vietQrUrl;
    String transferContent;
    String instructorNote;
    String adminNote;
    String bankTransactionRef;
    LocalDateTime createdAt;
    LocalDateTime processedAt;
}
