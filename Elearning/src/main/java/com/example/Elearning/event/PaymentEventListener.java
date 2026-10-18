package com.example.Elearning.event;

import com.example.Elearning.enums.NotificationType;
import com.example.Elearning.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.text.NumberFormat;
import java.util.Locale;

/**
 * Tác vụ phụ sau thanh toán / rút tiền, tách khỏi luồng chính.
 *
 * AFTER_COMMIT: chỉ gửi thông báo khi transaction đã commit thật — rollback thì không gửi gì.
 * @Async: chạy trên thread pool riêng, webhook trả 200 ngay không phải chờ ghi notification.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PaymentEventListener {

    private final NotificationService notificationService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onPaymentConfirmed(PaymentConfirmedEvent event) {
        try {
            notificationService.createNotification(
                    event.studentId(),
                    "Thanh toán thành công",
                    "Thanh toán cho khóa học '" + event.courseTitle() + "' đã được xác nhận. Bạn có thể bắt đầu học ngay!",
                    NotificationType.PAYMENT_CONFIRMED,
                    event.paymentRequestId()
            );

            String holdText = event.holdDays() > 0
                    ? " Khoản này sẽ được rút sau " + event.holdDays() + " ngày tạm giữ."
                    : "";
            notificationService.createNotification(
                    event.instructorId(),
                    "Bạn vừa bán được khóa học",
                    "Khóa học '" + event.courseTitle() + "' vừa được mua. Doanh thu thực nhận "
                            + money(event.instructorEarning()) + " đã được cộng vào ví." + holdText,
                    NotificationType.COURSE_SOLD,
                    event.paymentRequestId()
            );
        } catch (Exception e) {
            // Thanh toán đã commit — lỗi gửi thông báo chỉ log, không ảnh hưởng nghiệp vụ.
            log.error("[Async] Gửi thông báo thanh toán {} thất bại", event.paymentRequestId(), e);
        }
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onWithdrawalProcessed(WithdrawalProcessedEvent event) {
        try {
            if (event.approved()) {
                notificationService.createNotification(
                        event.instructorId(),
                        "Rút tiền thành công",
                        "Yêu cầu rút " + money(event.amount()) + " đã được chuyển vào tài khoản ngân hàng của bạn.",
                        NotificationType.WITHDRAWAL_APPROVED,
                        event.withdrawalId()
                );
            } else {
                notificationService.createNotification(
                        event.instructorId(),
                        "Yêu cầu rút tiền bị từ chối",
                        "Yêu cầu rút " + money(event.amount()) + " bị từ chối"
                                + (event.adminNote() != null ? ". Lý do: " + event.adminNote() : "")
                                + ". Số tiền đã được hoàn lại số dư khả dụng.",
                        NotificationType.WITHDRAWAL_REJECTED,
                        event.withdrawalId()
                );
            }
        } catch (Exception e) {
            log.error("[Async] Gửi thông báo rút tiền {} thất bại", event.withdrawalId(), e);
        }
    }

    private static String money(java.math.BigDecimal amount) {
        if (amount == null) {
            return "0đ";
        }
        return NumberFormat.getInstance(Locale.forLanguageTag("vi-VN")).format(amount) + "đ";
    }
}
