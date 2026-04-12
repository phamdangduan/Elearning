package com.example.Elearning.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentInfoResponse {
    String instructorName;
    String bankName;
    String accountNumber;
    String accountName;
    String qrCodeUrl;
    BigDecimal amount;
    String referenceCode;
    String note;
}
