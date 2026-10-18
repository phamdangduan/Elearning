package com.example.Elearning.event;

import java.math.BigDecimal;

public record WithdrawalProcessedEvent(
        String withdrawalId,
        String instructorId,
        BigDecimal amount,
        boolean approved,
        String adminNote
) {
}
