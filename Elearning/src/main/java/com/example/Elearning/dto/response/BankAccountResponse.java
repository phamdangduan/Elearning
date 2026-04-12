package com.example.Elearning.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class BankAccountResponse {
    String id;
    String bankName;
    String accountNumber;
    String accountName;
    String qrCodeUrl;
    Boolean isPrimary;
    Boolean isActive;
    LocalDateTime createdAt;
}
