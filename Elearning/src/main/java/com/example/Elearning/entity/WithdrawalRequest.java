package com.example.Elearning.entity;

import com.example.Elearning.enums.WithdrawalStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Yêu cầu rút tiền của giảng viên.
 * Thông tin ngân hàng được SNAPSHOT tại thời điểm tạo yêu cầu, để giảng viên có sửa/xóa
 * InstructorBankAccount sau đó thì admin vẫn chuyển đúng tài khoản đã yêu cầu.
 */
@Entity
@Table(name = "withdrawal_requests", indexes = {
        @Index(name = "idx_withdrawal_instructor_status", columnList = "instructor_id, status"),
        @Index(name = "idx_withdrawal_status", columnList = "status")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uk_withdrawal_code", columnNames = "code")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class WithdrawalRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36)
    String id;

    /** Mã yêu cầu, dùng làm nội dung chuyển khoản khi admin chi tiền. */
    @Column(name = "code", length = 20, nullable = false)
    String code;

    @Column(name = "instructor_id", length = 36, nullable = false)
    String instructorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id", insertable = false, updatable = false)
    User instructor;

    @Column(name = "amount", precision = 19, scale = 2, nullable = false)
    BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    WithdrawalStatus status;

    // ── Snapshot tài khoản nhận tiền ──
    @Column(name = "bank_account_id", length = 36)
    String bankAccountId;

    @Column(name = "bank_name", length = 100, nullable = false)
    String bankName;

    @Column(name = "account_number", length = 50, nullable = false)
    String accountNumber;

    @Column(name = "account_name", length = 255, nullable = false)
    String accountName;

    @Column(name = "qr_code_url", length = 500)
    String qrCodeUrl;

    @Column(name = "instructor_note", length = 500)
    String instructorNote;

    @Column(name = "admin_note", length = 500)
    String adminNote;

    /** Mã giao dịch ngân hàng khi admin chuyển tiền (để đối soát). */
    @Column(name = "bank_transaction_ref", length = 100)
    String bankTransactionRef;

    @Column(name = "processed_by", length = 36)
    String processedBy;

    @Column(name = "created_at", nullable = false)
    LocalDateTime createdAt;

    @Column(name = "processed_at")
    LocalDateTime processedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = WithdrawalStatus.PENDING;
        }
    }
}
