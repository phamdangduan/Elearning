package com.example.Elearning.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Ví doanh thu của giảng viên (1 giảng viên — 1 ví).
 *
 * pendingBalance   : doanh thu đang trong thời gian tạm giữ, chưa được rút
 * availableBalance : số dư khả dụng, được phép tạo yêu cầu rút
 * lockedBalance    : đã trừ tạm thời cho các yêu cầu rút đang chờ admin chi
 *
 * Mọi thay đổi số dư đều phải đi qua WalletService (khóa dòng FOR UPDATE + ghi sổ cái WalletTransaction).
 */
@Entity
@Table(name = "instructor_wallets", uniqueConstraints = {
        @UniqueConstraint(name = "uk_instructor_wallet_user", columnNames = "user_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InstructorWallet {
    @Id
    @Column(name = "id", length = 36)
    String id;

    @Column(name = "user_id", length = 36, nullable = false)
    String userId;

    @Column(name = "pending_balance", precision = 19, scale = 2, nullable = false)
    BigDecimal pendingBalance;

    @Column(name = "available_balance", precision = 19, scale = 2, nullable = false)
    BigDecimal availableBalance;

    @Column(name = "locked_balance", precision = 19, scale = 2, nullable = false)
    BigDecimal lockedBalance;

    @Column(name = "total_earned", precision = 19, scale = 2, nullable = false)
    BigDecimal totalEarned;

    @Column(name = "total_withdrawn", precision = 19, scale = 2, nullable = false)
    BigDecimal totalWithdrawn;

    /** Optimistic lock — lưới an toàn thứ hai nếu có code nào cập nhật ví mà quên khóa FOR UPDATE. */
    @Version
    @Column(name = "version", nullable = false)
    Long version;

    @Column(name = "created_at")
    LocalDateTime createdAt;

    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
