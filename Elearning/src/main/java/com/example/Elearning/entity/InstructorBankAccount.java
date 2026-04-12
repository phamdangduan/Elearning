package com.example.Elearning.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "instructor_bank_accounts")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)

public class InstructorBankAccount implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36)
    String id;

    @Column(name = "user_id", length = 36, nullable = false)
    String userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    User user;

    @Column(name = "bank_name", length = 100, nullable = false)
    String bankName;

    @Column(name = "account_number", length = 50, nullable = false)
    String accountNumber;

    @Column(name = "account_name", length = 255, nullable = false)
    String accountName;

    @Column(name = "qr_code_url", length = 500)
    String qrCodeUrl;

    @Column(name = "is_primary", nullable = false)
    Boolean isPrimary = false;

    @Column(name = "is_active", nullable = false)
    Boolean isActive = true;

    @Column(name = "created_at")
    LocalDateTime createdAt;

    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }




}
