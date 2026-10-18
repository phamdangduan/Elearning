package com.example.Elearning.entity;

import com.example.Elearning.enums.TransactionMatchStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Nhật ký mọi giao dịch ngân hàng nhận từ cổng thanh toán (SePay).
 *
 * UNIQUE (provider, provider_transaction_id) là chốt chặn idempotency:
 * cổng thanh toán retry cùng một giao dịch bao nhiêu lần cũng chỉ được xử lý đúng 1 lần.
 * Giao dịch không khớp đơn nào vẫn được lưu (UNMATCHED) để admin đối soát thủ công.
 */
@Entity
@Table(name = "payment_transactions", uniqueConstraints = {
        @UniqueConstraint(name = "uk_payment_txn_provider_id", columnNames = {"provider", "provider_transaction_id"})
}, indexes = {
        @Index(name = "idx_payment_txn_reference", columnList = "reference_code"),
        @Index(name = "idx_payment_txn_status", columnList = "match_status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36)
    String id;

    @Column(name = "provider", length = 20, nullable = false)
    String provider;

    @Column(name = "provider_transaction_id", length = 64, nullable = false)
    String providerTransactionId;

    @Column(name = "gateway", length = 100)
    String gateway;

    @Column(name = "account_number", length = 50)
    String accountNumber;

    @Column(name = "transfer_type", length = 10)
    String transferType;

    @Column(name = "amount", precision = 19, scale = 2, nullable = false)
    BigDecimal amount;

    @Column(name = "content", length = 1000)
    String content;

    /** Mã giao dịch phía ngân hàng (field referenceCode của SePay). */
    @Column(name = "bank_reference", length = 100)
    String bankReference;

    @Column(name = "transaction_date", length = 30)
    String transactionDate;

    /** Mã đối soát của hệ thống tách được từ nội dung chuyển khoản (EDUxxxxxxxx). */
    @Column(name = "reference_code", length = 100)
    String referenceCode;

    @Column(name = "payment_request_id", length = 36)
    String paymentRequestId;

    @Enumerated(EnumType.STRING)
    @Column(name = "match_status", length = 20, nullable = false)
    TransactionMatchStatus matchStatus;

    @Column(name = "note", length = 500)
    String note;

    @Column(name = "raw_payload", columnDefinition = "TEXT")
    String rawPayload;

    @Column(name = "created_at", nullable = false)
    LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
