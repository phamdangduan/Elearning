package com.example.Elearning.scheduler;

import com.example.Elearning.service.PaymentRequestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PaymentScheduler {

    private final PaymentRequestService paymentRequestService;

    // Chạy mỗi 1 giờ (phút 0 của mỗi giờ)
    @Scheduled(cron = "0 * * * * *")
    public void expireOldPayments() {
        log.info("Running scheduled job: expireOldPaymentRequests");
        paymentRequestService.expireOldPaymentRequests();
    }
}
