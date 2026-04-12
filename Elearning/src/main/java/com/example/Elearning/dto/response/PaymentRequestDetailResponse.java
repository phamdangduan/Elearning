package com.example.Elearning.dto.response;

import com.example.Elearning.enums.PaymentStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentRequestDetailResponse {
    String id;

    // Student info
    String studentId;
    String studentName;
    String studentEmail;

    // Course info
    String courseId;
    String courseTitle;
    String courseDescription;
    String courseThumbnail;

    // Instructor info
    String instructorId;
    String instructorName;

    // Bank account info
    BankAccountResponse bankAccount;

    // Payment info
    BigDecimal amount;
    String paymentProofUrl;
    String transferNote;
    PaymentStatus status;
    String studentNote;
    String instructorNote;
    String referenceCode;

    // Timestamps
    LocalDateTime createdAt;
    LocalDateTime confirmedAt;
    LocalDateTime expiredAt;
    Long timeRemainingSeconds;
}
