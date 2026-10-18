package com.example.Elearning.repository;

import com.example.Elearning.entity.WithdrawalRequest;
import com.example.Elearning.enums.WithdrawalStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WithdrawalRequestRepository extends JpaRepository<WithdrawalRequest, String> {

    List<WithdrawalRequest> findByInstructorIdOrderByCreatedAtDesc(String instructorId);

    boolean existsByInstructorIdAndStatus(String instructorId, WithdrawalStatus status);

    boolean existsByCode(String code);

    @Query("SELECT w FROM WithdrawalRequest w LEFT JOIN FETCH w.instructor " +
            "WHERE (:status IS NULL OR w.status = :status) " +
            "ORDER BY w.createdAt DESC")
    List<WithdrawalRequest> findAllWithInstructor(@Param("status") WithdrawalStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT w FROM WithdrawalRequest w WHERE w.id = :id")
    Optional<WithdrawalRequest> findByIdForUpdate(@Param("id") String id);
}
