package com.example.Elearning.repository;

import com.example.Elearning.entity.InstructorWallet;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InstructorWalletRepository extends JpaRepository<InstructorWallet, String> {

    Optional<InstructorWallet> findByUserId(String userId);

    /** SELECT ... FOR UPDATE — mọi thao tác thay đổi số dư phải đi qua đây. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM InstructorWallet w WHERE w.userId = :userId")
    Optional<InstructorWallet> findByUserIdForUpdate(@Param("userId") String userId);

    /**
     * Tạo ví nếu chưa có. INSERT IGNORE an toàn khi 2 webhook của cùng một giảng viên mới
     * đến đồng thời: luồng sau chờ khóa unique key của luồng trước rồi bỏ qua, không lỗi duplicate.
     */
    @Modifying
    @Query(value = "INSERT IGNORE INTO instructor_wallets " +
            "(id, user_id, pending_balance, available_balance, locked_balance, total_earned, total_withdrawn, version, created_at, updated_at) " +
            "VALUES (UUID(), :userId, 0, 0, 0, 0, 0, 0, NOW(), NOW())", nativeQuery = true)
    int insertIfAbsent(@Param("userId") String userId);
}
