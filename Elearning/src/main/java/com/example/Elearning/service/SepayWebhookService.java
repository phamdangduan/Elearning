package com.example.Elearning.service;

import com.example.Elearning.config.PaymentProperties;
import com.example.Elearning.dto.request.SepayWebhookRequest;
import com.example.Elearning.entity.PaymentRequest;
import com.example.Elearning.entity.PaymentTransaction;
import com.example.Elearning.enums.PaymentStatus;
import com.example.Elearning.enums.TransactionMatchStatus;
import com.example.Elearning.repository.EnrollmentRepository;
import com.example.Elearning.repository.PaymentRequestRepository;
import com.example.Elearning.repository.PaymentTransactionRepository;
import com.example.Elearning.utils.ReferenceCodeGenerator;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Xử lý webhook biến động số dư từ SePay.
 *
 * Thứ tự trong 1 transaction:
 *  1. Ghi PaymentTransaction (UNIQUE provider_transaction_id) → chốt idempotency, webhook trùng sẽ dừng ở đây.
 *  2. Lọc giao dịch: chỉ tiền VÀO tài khoản của sàn.
 *  3. Tách mã đối soát từ nội dung chuyển khoản.
 *  4. SELECT ... FOR UPDATE đơn hàng → các webhook cùng đơn phải xếp hàng.
 *  5. Kiểm tra trạng thái / số tiền / quyền sở hữu → settle.
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class SepayWebhookService {

    public static final String PROVIDER = "SEPAY";

    PaymentTransactionRepository paymentTransactionRepository;
    PaymentRequestRepository paymentRequestRepository;
    EnrollmentRepository enrollmentRepository;
    PaymentSettlementService settlementService;
    PaymentProperties paymentProperties;

    public enum Outcome {
        PROCESSED,       // Đã ghi nhận (khớp hoặc không khớp đơn)
        DUPLICATE_EVENT  // Giao dịch này đã được xử lý trước đó (SePay retry)
    }

    public record Result(Outcome outcome, TransactionMatchStatus matchStatus, String message) {
    }

    public boolean isAlreadyRecorded(Long providerTransactionId) {
        return providerTransactionId != null && paymentTransactionRepository
                .existsByProviderAndProviderTransactionId(PROVIDER, String.valueOf(providerTransactionId));
    }

    @Transactional
    public Result handle(SepayWebhookRequest request, String rawPayload) {
        String providerTxnId = String.valueOf(request.getId());

        // ── 1. Idempotency theo ID giao dịch của SePay ─────────────────────────
        if (isAlreadyRecorded(request.getId())) {
            log.info("[Webhook] Bỏ qua giao dịch SePay {} đã xử lý trước đó", providerTxnId);
            return new Result(Outcome.DUPLICATE_EVENT, null, "Transaction already processed");
        }

        PaymentTransaction txn = PaymentTransaction.builder()
                .provider(PROVIDER)
                .providerTransactionId(providerTxnId)
                .gateway(request.getGateway())
                .accountNumber(request.getAccountNumber())
                .transferType(request.getTransferType())
                .amount(request.getTransferAmount() != null ? request.getTransferAmount() : BigDecimal.ZERO)
                .content(truncate(request.getContent(), 1000))
                .bankReference(truncate(request.getReferenceCode(), 100))
                .transactionDate(truncate(request.getTransactionDate(), 30))
                .matchStatus(TransactionMatchStatus.UNMATCHED)
                .rawPayload(rawPayload)
                .build();
        // saveAndFlush ngay: nếu 2 webhook trùng ID đến cùng lúc, luồng sau bị chặn ở UNIQUE key
        // cho tới khi luồng trước commit, rồi nhận DataIntegrityViolationException (controller xử lý).
        paymentTransactionRepository.saveAndFlush(txn);

        // ── 2. Chỉ nhận tiền VÀO tài khoản của sàn ────────────────────────────
        if (!"in".equalsIgnoreCase(request.getTransferType())) {
            return finish(txn, TransactionMatchStatus.IGNORED, "Giao dịch tiền ra — bỏ qua");
        }
        if (!isPlatformAccount(request)) {
            return finish(txn, TransactionMatchStatus.IGNORED,
                    "Không phải tài khoản nhận tiền của sàn: " + request.getAccountNumber());
        }
        BigDecimal paid = request.getTransferAmount();
        if (paid == null || paid.signum() <= 0) {
            return finish(txn, TransactionMatchStatus.IGNORED, "Số tiền không hợp lệ");
        }

        // ── 3. Tách mã đối soát ────────────────────────────────────────────────
        String code = extractReferenceCode(request.getCode(), request.getContent());
        txn.setReferenceCode(code);
        if (code == null) {
            return finish(txn, TransactionMatchStatus.UNMATCHED, "Không tìm thấy mã đối soát trong nội dung chuyển khoản");
        }

        // ── 4. Khóa bi quan dòng đơn hàng ──────────────────────────────────────
        Optional<PaymentRequest> paymentOpt = paymentRequestRepository.findByReferenceCodeForUpdate(code);
        if (paymentOpt.isEmpty()) {
            return finish(txn, TransactionMatchStatus.UNMATCHED, "Không có đơn hàng với mã " + code);
        }
        PaymentRequest payment = paymentOpt.get();
        txn.setPaymentRequestId(payment.getId());

        // ── 5. Kiểm tra nghiệp vụ ──────────────────────────────────────────────
        if (payment.getStatus() == PaymentStatus.CONFIRMED) {
            return finish(txn, TransactionMatchStatus.DUPLICATE,
                    "Đơn đã được thanh toán trước đó — học viên chuyển thêm lần nữa, CẦN HOÀN TIỀN");
        }
        if (paid.compareTo(payment.getAmount()) < 0) {
            return finish(txn, TransactionMatchStatus.UNDERPAID,
                    "Chuyển thiếu: nhận " + paid.toPlainString() + " / cần " + payment.getAmount().toPlainString());
        }
        if (enrollmentRepository.existsByUserIdAndCourseId(payment.getStudentId(), payment.getCourseId())) {
            return finish(txn, TransactionMatchStatus.DUPLICATE,
                    "Học viên đã sở hữu khóa học qua đơn khác — CẦN HOÀN TIỀN");
        }

        PaymentStatus previous = payment.getStatus();
        String note = previous == PaymentStatus.PENDING
                ? "Tự động xác nhận qua SePay"
                : "Tự động xác nhận qua SePay (hồi sinh đơn " + previous + ")";
        settlementService.settle(payment, paid, note);

        String matchNote = note;
        if (paid.compareTo(payment.getAmount()) > 0) {
            matchNote += " — chuyển dư " + paid.subtract(payment.getAmount()).toPlainString() + ", cần hoàn phần dư";
        }
        return finish(txn, TransactionMatchStatus.MATCHED, matchNote);
    }

    /** Ưu tiên field "code" của SePay, sau đó quét nội dung chuyển khoản. */
    String extractReferenceCode(String sepayCode, String content) {
        String prefix = paymentProperties.getReferencePrefix().toUpperCase();
        Pattern pattern = Pattern.compile(Pattern.quote(prefix) + "[A-Z0-9]{" + ReferenceCodeGenerator.RANDOM_LENGTH + "}");

        for (String candidate : new String[]{sepayCode, content}) {
            if (candidate == null || candidate.isBlank()) {
                continue;
            }
            String upper = candidate.toUpperCase();
            Matcher m = pattern.matcher(upper);
            if (m.find()) {
                return m.group();
            }
            // Một số ngân hàng chèn dấu cách/gạch vào giữa nội dung → thử lại sau khi bỏ ký tự đặc biệt
            m = pattern.matcher(upper.replaceAll("[^A-Z0-9]", ""));
            if (m.find()) {
                return m.group();
            }
        }
        return null;
    }

    private boolean isPlatformAccount(SepayWebhookRequest request) {
        String platform = normalizeAccount(paymentProperties.getPlatform().getAccountNumber());
        return platform != null && (platform.equals(normalizeAccount(request.getAccountNumber()))
                || platform.equals(normalizeAccount(request.getSubAccount())));
    }

    private static String normalizeAccount(String account) {
        return account == null ? null : account.replaceAll("\\s", "");
    }

    private Result finish(PaymentTransaction txn, TransactionMatchStatus status, String note) {
        txn.setMatchStatus(status);
        txn.setNote(truncate(note, 500));
        paymentTransactionRepository.save(txn);
        if (status == TransactionMatchStatus.MATCHED) {
            log.info("[Webhook] SePay {} → {} ({})", txn.getProviderTransactionId(), status, note);
        } else {
            log.warn("[Webhook] SePay {} → {} ({})", txn.getProviderTransactionId(), status, note);
        }
        return new Result(Outcome.PROCESSED, status, note);
    }

    private static String truncate(String value, int max) {
        return value == null || value.length() <= max ? value : value.substring(0, max);
    }
}
