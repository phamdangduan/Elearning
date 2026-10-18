package com.example.Elearning.repository;

import com.example.Elearning.entity.WalletTransaction;
import com.example.Elearning.enums.WalletTransactionType;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, String> {

    List<WalletTransaction> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    /** Các khoản doanh thu đã hết thời gian tạm giữ nhưng chưa được giải phóng. */
    @Query("SELECT t.id FROM WalletTransaction t " +
            "WHERE t.type = :type AND t.released = false AND t.availableAt <= :now " +
            "ORDER BY t.availableAt ASC")
    List<String> findMaturedIds(@Param("type") WalletTransactionType type,
                                @Param("now") LocalDateTime now,
                                Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM WalletTransaction t WHERE t.id = :id")
    Optional<WalletTransaction> findByIdForUpdate(@Param("id") String id);
}
