package com.example.Elearning.repository;

import com.example.Elearning.entity.PaymentRequest;
import com.example.Elearning.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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


    // Tính tổng doanh thu của instructor (chỉ tính payment CONFIRMED)
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM PaymentRequest p " +
            "WHERE p.instructorId = :instructorId " +
            "AND p.status = 'CONFIRMED'")
    BigDecimal calculateTotalRevenueByInstructor(@Param("instructorId") String instructorId);

    // Tính doanh thu theo từng khóa học
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM PaymentRequest p " +
            "WHERE p.course.id = :courseId " +
            "AND p.status = 'CONFIRMED'")
    BigDecimal calculateRevenueByCourse(@Param("courseId") String courseId);

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

    List<PaymentRequest> findByStatus(PaymentStatus status);


}
