package com.example.Elearning.dto.response;

import com.example.Elearning.enums.PaymentStatus;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

/** Response gọn nhẹ cho checkout polling mỗi 2 giây. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentStatusResponse {
    String id;
    String courseId;
    PaymentStatus status;
    LocalDateTime expiredAt;
    LocalDateTime confirmedAt;
    Long timeRemainingSeconds;
}
