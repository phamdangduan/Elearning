package com.example.Elearning.dto.response;

import com.example.Elearning.enums.WalletTransactionType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WalletTransactionResponse {
    String id;
    WalletTransactionType type;
    BigDecimal amount;
    BigDecimal availableAfter;
    String referenceId;
    String note;
    LocalDateTime availableAt;
    Boolean released;
    LocalDateTime createdAt;
}
