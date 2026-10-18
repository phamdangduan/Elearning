package com.example.Elearning.scheduler;

import com.example.Elearning.service.PaymentRequestService;
import com.example.Elearning.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentScheduler {

    private final PaymentRequestService paymentRequestService;
    private final WalletService walletService;

    // Chạy mỗi phút (giây 0): đánh dấu EXPIRED cho các đơn PENDING quá hạn
    @Scheduled(cron = "0 * * * * *")
    public void expireOldPayments() {
        log.debug("Running scheduled job: expireOldPaymentRequests");
        paymentRequestService.expireOldPaymentRequests();
    }

    // Chạy mỗi 10 phút: chuyển doanh thu đã hết thời gian tạm giữ sang số dư khả dụng
    @Scheduled(cron = "0 */10 * * * *")
    public void releaseMaturedEarnings() {
        walletService.releaseMaturedEarnings();
    }
}
