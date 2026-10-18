package com.example.Elearning.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WalletResponse {
    String userId;
    BigDecimal pendingBalance;      // Đang tạm giữ
    BigDecimal availableBalance;    // Có thể rút
    BigDecimal lockedBalance;       // Đang chờ admin chi
    BigDecimal totalEarned;
    BigDecimal totalWithdrawn;
    BigDecimal commissionRate;      // Tỷ lệ sàn giữ lại, để hiển thị
    Integer holdDays;
    BigDecimal minWithdrawal;
    List<WalletTransactionResponse> recentTransactions;
}
