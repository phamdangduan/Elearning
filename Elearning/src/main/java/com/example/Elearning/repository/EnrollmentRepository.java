package com.example.Elearning.repository;

import com.example.Elearning.entity.Enrollment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, String> {
    boolean existsByUser_IdAndCourse_Id(String userId, String courseId);
    Page<Enrollment> findByUser_Id(String userId, Pageable pageable);
    boolean existsByUserIdAndCourseId(String userId, String courseId);
    Integer countByCourseId(String courseId);


    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.course.id = :courseId")
    Long countEnrollmentsByCourseId(@Param("courseId") String courseId);

    // Đếm tổng số học sinh của instructor (unique students)
    @Query("SELECT COUNT(DISTINCT e.user.id) FROM Enrollment e " +
            "WHERE e.course.user.id = :instructorId")
    Long countUniqueStudentsByInstructor(@Param("instructorId") String instructorId);

    // Đếm tổng số khóa học đã đăng ký của student
    @Query("SELECT COUNT(e) FROM Enrollment e WHERE e.user.id = :studentId")
    Long countEnrollmentsByStudent(@Param("studentId") String studentId);

    // Lấy tất cả enrollment của student với thông tin course
    // QUAN TRỌNG: KHÔNG filter theo instructor status vì:
    // - Học sinh đã trả tiền cho khóa học
    // - Họ vẫn có quyền học dù instructor bị khóa (BANNED/INACTIVE)
    // - Chỉ ẩn khóa học với người dùng MỚI, không phải học sinh đã đăng ký
    @Query("SELECT e FROM Enrollment e " +
            "LEFT JOIN FETCH e.course c " +
            "LEFT JOIN FETCH c.user " +
            "WHERE e.user.id = :studentId " +
            "ORDER BY e.enrollmentDate DESC")
    List<Enrollment> findAllByStudentIdWithCourse(@Param("studentId") String studentId);

    // Lấy tất cả enrollment của instructor (tất cả học sinh trong các khóa học của instructor)
    @Query("SELECT e FROM Enrollment e " +
            "LEFT JOIN FETCH e.course c " +
            "LEFT JOIN FETCH e.user u " +
            "WHERE c.user.id = :instructorId " +
            "ORDER BY e.enrollmentDate DESC")
    List<Enrollment> findAllByInstructorId(@Param("instructorId") String instructorId);

    // Lấy enrollment của instructor với phân trang
    @Query("SELECT e FROM Enrollment e " +
            "JOIN FETCH e.course c " +
            "JOIN FETCH e.user u " +
            "WHERE c.user.id = :instructorId " +
            "ORDER BY e.enrollmentDate DESC")
    Page<Enrollment> findAllByInstructorIdWithPaging(@Param("instructorId") String instructorId, Pageable pageable);

}