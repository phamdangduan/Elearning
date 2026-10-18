package com.example.Elearning.entity;

import com.example.Elearning.enums.WalletTransactionType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Sổ cái ví giảng viên — chỉ INSERT, không sửa số tiền.
 * Dùng để đối soát: tổng các bút toán phải khớp với số dư trong InstructorWallet.
 */
@Entity
@Table(name = "wallet_transactions", indexes = {
        @Index(name = "idx_wallet_txn_user", columnList = "user_id"),
        @Index(name = "idx_wallet_txn_release", columnList = "type, released, available_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WalletTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36)
    String id;

    @Column(name = "user_id", length = 36, nullable = false)
    String userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 30, nullable = false)
    WalletTransactionType type;

    @Column(name = "amount", precision = 19, scale = 2, nullable = false)
    BigDecimal amount;

    /** Số dư khả dụng sau bút toán (tiện tra cứu). */
    @Column(name = "available_after", precision = 19, scale = 2)
    BigDecimal availableAfter;

    /** paymentRequestId (SALE_*) hoặc withdrawalRequestId (WITHDRAW_*). */
    @Column(name = "reference_id", length = 36)
    String referenceId;

    @Column(name = "note", length = 500)
    String note;

    /** Chỉ dùng cho SALE_CREDIT: thời điểm hết tạm giữ. */
    @Column(name = "available_at")
    LocalDateTime availableAt;

    /** Chỉ dùng cho SALE_CREDIT: đã chuyển từ pending sang available chưa. */
    @Column(name = "released")
    Boolean released;

    @Column(name = "created_at", nullable = false)
    LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
