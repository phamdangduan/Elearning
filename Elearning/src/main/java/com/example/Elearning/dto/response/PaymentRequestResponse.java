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
public class PaymentRequestResponse {
    String id;
    String studentId;
    String studentName;
    String courseId;
    String courseTitle;
    String courseThumbnail;
    String instructorId;
    String instructorName;
    BigDecimal amount;
    String paymentProofUrl;
    String transferNote;
    PaymentStatus status;
    String studentNote;
    String instructorNote;
    String referenceCode;
    LocalDateTime createdAt;
    LocalDateTime confirmedAt;
    LocalDateTime expiredAt;
    Long timeRemainingSeconds; // Thời gian còn lại (giây)
}
