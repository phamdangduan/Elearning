package com.example.Elearning.repository;

import com.example.Elearning.entity.PaymentRequest;
import com.example.Elearning.enums.PaymentStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRequestRepository extends JpaRepository<PaymentRequest, String> {

    // Lấy lịch sử payment của học sinh
    @Query("SELECT p FROM PaymentRequest p " +
            "LEFT JOIN FETCH p.student " +
            "LEFT JOIN FETCH p.course " +
            "LEFT JOIN FETCH p.instructor " +
            "LEFT JOIN FETCH p.instructorBankAccount " +
            "WHERE p.id = :id")
    Optional<PaymentRequest> findByIdWithDetails(@Param("id") String id);

    @Query("SELECT p FROM PaymentRequest p " +
            "LEFT JOIN FETCH p.student " +
            "LEFT JOIN FETCH p.course " +
            "LEFT JOIN FETCH p.instructor " +
            "WHERE p.studentId = :studentId " +
            "ORDER BY p.createdAt DESC")
    List<PaymentRequest> findByStudentIdWithDetailsOrderByCreatedAtDesc(@Param("studentId") String studentId);


    @Query("SELECT p FROM PaymentRequest p " +
            "LEFT JOIN FETCH p.student " +
            "LEFT JOIN FETCH p.course " +
            "LEFT JOIN FETCH p.instructor " +
            "WHERE p.instructorId = :instructorId " +
            "AND (:status IS NULL OR p.status = :status) " +
            "ORDER BY p.createdAt DESC")
    List<PaymentRequest> findByInstructorIdAndStatusWithDetails(
            @Param("instructorId") String instructorId,
            @Param("status") PaymentStatus status
    );


    // Tính tổng doanh thu THỰC NHẬN của instructor (chỉ tính payment CONFIRMED).
    // Đơn của luồng cũ (tiền chuyển thẳng cho giảng viên) không có instructorEarning → tính 100% amount.
    @Query("SELECT COALESCE(SUM(COALESCE(p.instructorEarning, p.amount)), 0) FROM PaymentRequest p " +
            "WHERE p.instructorId = :instructorId " +
            "AND p.status = 'CONFIRMED'")
    BigDecimal calculateTotalRevenueByInstructor(@Param("instructorId") String instructorId);

    // Tính doanh thu thực nhận của instructor theo từng khóa học
    @Query("SELECT COALESCE(SUM(COALESCE(p.instructorEarning, p.amount)), 0) FROM PaymentRequest p " +
            "WHERE p.course.id = :courseId " +
            "AND p.status = 'CONFIRMED'")
    BigDecimal calculateRevenueByCourse(@Param("courseId") String courseId);

    // ── Webhook / Settlement ──

    boolean existsByReferenceCode(String referenceCode);

    /** SELECT ... FOR UPDATE theo mã đối soát — xếp hàng các webhook cùng một đơn. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PaymentRequest p WHERE p.referenceCode = :referenceCode")
    Optional<PaymentRequest> findByReferenceCodeForUpdate(@Param("referenceCode") String referenceCode);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PaymentRequest p WHERE p.id = :id")
    Optional<PaymentRequest> findByIdForUpdate(@Param("id") String id);

    /**
     * Đánh dấu EXPIRED CHỈ KHI đơn vẫn còn PENDING (compare-and-set).
     * Không dùng load → setStatus → save, vì webhook có thể vừa CONFIRMED đơn này ở giữa 2 bước đó.
     */
    @Modifying
    @Query("UPDATE PaymentRequest p SET p.status = com.example.Elearning.enums.PaymentStatus.EXPIRED " +
            "WHERE p.id = :id AND p.status = com.example.Elearning.enums.PaymentStatus.PENDING")
    int expireIfPending(@Param("id") String id);

    /** Khi một đơn được xác nhận: hủy các đơn PENDING khác của cùng học viên cho cùng khóa học. */
    @Modifying
    @Query("UPDATE PaymentRequest p SET p.status = com.example.Elearning.enums.PaymentStatus.CANCELLED " +
            "WHERE p.studentId = :studentId AND p.courseId = :courseId " +
            "AND p.status = com.example.Elearning.enums.PaymentStatus.PENDING AND p.id <> :keepId")
    int cancelOtherPending(@Param("studentId") String studentId,
                           @Param("courseId") String courseId,
                           @Param("keepId") String keepId);

    // Đếm số payment đã confirmed của instructor
    @Query("SELECT COUNT(p) FROM PaymentRequest p " +
            "WHERE p.instructorId = :instructorId " +
            "AND p.status = 'CONFIRMED'")
    Long countConfirmedPaymentsByInstructor(@Param("instructorId") String instructorId);

    List<PaymentRequest> findByStudentIdOrderByCreatedAtDesc(String studentId);

    List<PaymentRequest> findByInstructorIdAndStatusOrderByCreatedAtDesc(String instructorId, PaymentStatus status);

    // Lấy tất cả payment requests của instructor
    List<PaymentRequest> findByInstructorIdOrderByCreatedAtDesc(String instructorId);

    // Check xem học sinh có payment PENDING cho course này không
    Optional<PaymentRequest> findByStudentIdAndCourseIdAndStatus(String studentId, String courseId, PaymentStatus status);

    // Tìm các payment đã hết hạn (để auto-expire)
    List<PaymentRequest> findByStatusAndExpiredAtBefore(PaymentStatus status, LocalDateTime expiredAt);

    @Query("SELECT p FROM PaymentRequest p " +
            "LEFT JOIN FETCH p.student " +
            "LEFT JOIN FETCH p.course " +
            "LEFT JOIN FETCH p.instructor " +
            "WHERE p.status = :status " +
            "ORDER BY p.createdAt DESC")
    List<PaymentRequest> findByStatus(@Param("status") PaymentStatus status);

    @Query("SELECT p FROM PaymentRequest p " +
            "LEFT JOIN FETCH p.student " +
            "LEFT JOIN FETCH p.course " +
            "LEFT JOIN FETCH p.instructor " +
            "ORDER BY p.createdAt DESC")
    List<PaymentRequest> findAllWithDetails();

    // ── Admin Stats Queries (tính trực tiếp từ DB) ──
    /** Tổng tiền học viên đã thanh toán (GMV). */
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM PaymentRequest p WHERE p.status = 'CONFIRMED'")
    BigDecimal calculateTotalGrossRevenue();

    /** Doanh thu thực của sàn = tổng hoa hồng đã giữ lại. */
    @Query("SELECT COALESCE(SUM(p.platformFee), 0) FROM PaymentRequest p WHERE p.status = 'CONFIRMED'")
    BigDecimal calculateTotalPlatformFee();

    @Query("SELECT COUNT(p) FROM PaymentRequest p WHERE p.status = :status")
    Long countAllByPaymentStatus(@Param("status") PaymentStatus status);

    @Query("SELECT COUNT(p) FROM PaymentRequest p")
    Long countAllPayments();

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("DELETE FROM PaymentRequest p WHERE p.courseId = :courseId")
    void deleteByCourseId(@Param("courseId") String courseId);
}
