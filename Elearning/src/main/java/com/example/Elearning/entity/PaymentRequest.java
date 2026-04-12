package com.example.Elearning.entity;

import com.example.Elearning.enums.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payment_requests")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36)
    String id;

    @Column(name = "student_id", length = 36, nullable = false)
    String studentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", insertable = false, updatable = false)
    User student;

    @Column(name = "course_id", length = 36, nullable = false)
    String courseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", insertable = false, updatable = false)
    Course course;

    @Column(name = "instructor_id", length = 36, nullable = false)
    String instructorId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_id", insertable = false, updatable = false)
    User instructor;

    @Column(name = "instructor_bank_account_id", length = 36, nullable = false)
    String instructorBankAccountId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "instructor_bank_account_id", insertable = false, updatable = false)
    InstructorBankAccount instructorBankAccount;

    @Column(name = "amount", precision = 19, scale = 2, nullable = false)
    BigDecimal amount;

    @Column(name = "payment_proof_url", length = 500)
    String paymentProofUrl;

    // ← THÊM FIELD NÀY
    @Column(name = "transfer_note", length = 500)
    String transferNote;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20, nullable = false)
    PaymentStatus status = PaymentStatus.PENDING;

    @Column(name = "student_note", columnDefinition = "TEXT")
    String studentNote;

    @Column(name = "instructor_note", columnDefinition = "TEXT")
    String instructorNote;

    @Column(name = "reference_code", length = 100, nullable = false, unique = true)
    String referenceCode;

    @Column(name = "created_at", nullable = false)
    LocalDateTime createdAt;

    @Column(name = "confirmed_at")
    LocalDateTime confirmedAt;

    @Column(name = "expired_at", nullable = false)
    LocalDateTime expiredAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (expiredAt == null) {
            expiredAt = createdAt.plusMinutes(5);
        }
        if (status == null) {
            status = PaymentStatus.PENDING;
        }
    }
}
