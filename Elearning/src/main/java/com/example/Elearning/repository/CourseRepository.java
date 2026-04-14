package com.example.Elearning.repository;

import com.example.Elearning.dto.response.CourseResponse;
import com.example.Elearning.entity.Course;
import com.example.Elearning.enums.CourseStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, String> {
    Optional<Course> findCourseDetailsById(String courseId);
    
    // ← THÊM FILTER USER STATUS VÀO QUERY
    @Query("SELECT c FROM Course c WHERE c.status = :status " +
            "AND c.user.status = com.example.Elearning.enums.UserStatus.ACTIVE")
    Page<Course> findCourseByStatus(@Param("status") CourseStatus status, Pageable pageable);
    
    Page<Course> getCourseByUser_Id(String userId, Pageable pageable);

    // ← THÊM FILTER USER STATUS VÀO QUERY
    @Query("SELECT c FROM Course c WHERE c.user.id = :userId " +
            "AND c.status = :status " +
            "AND c.user.status = com.example.Elearning.enums.UserStatus.ACTIVE")
    Page<Course> findCourseByUserIdAndStatus(
            @Param("userId") String userId, 
            @Param("status") CourseStatus status, 
            Pageable pageable);

    // 1. Tìm kiếm theo keyword (title hoặc description)
    @Query("SELECT c FROM Course c WHERE c.status = :status " +
            "AND (LOWER(c.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "OR LOWER(c.description) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Course> searchByKeyword(
            @Param("keyword") String keyword,
            @Param("status") CourseStatus status,
            Pageable pageable
    );

    // 2. Filter theo category
    @Query("SELECT DISTINCT c FROM Course c " +
            "JOIN c.categories cat " +
            "WHERE c.status = :status AND cat.id = :categoryId")
    Page<Course> findByCategoryId(
            @Param("categoryId") String categoryId,
            @Param("status") CourseStatus status,
            Pageable pageable
    );

    // 3. Filter theo khoảng giá
    @Query("SELECT c FROM Course c WHERE c.status = :status " +
            "AND c.price BETWEEN :minPrice AND :maxPrice")
    Page<Course> findByPriceRange(
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("status") CourseStatus status,
            Pageable pageable
    );

    // 4. Search & Filter kết hợp (QUAN TRỌNG NHẤT)
    @Query("SELECT DISTINCT c FROM Course c " +
            "LEFT JOIN c.categories cat " +
            "WHERE c.status = :status " +
            "AND c.user.status = com.example.Elearning.enums.UserStatus.ACTIVE " +  // ← CHỈ LẤY KHÓA HỌC CỦA GIÁO VIÊN ĐANG HOẠT ĐỘNG
            "AND (:keyword IS NULL OR LOWER(c.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "    OR LOWER(c.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:categoryId IS NULL OR cat.id = :categoryId) " +
            "AND (:minPrice IS NULL OR c.price >= :minPrice) " +
            "AND (:maxPrice IS NULL OR c.price <= :maxPrice) " +
            "AND (:instructorId IS NULL OR c.user.id = :instructorId)")
    Page<Course> searchAndFilter(
            @Param("keyword") String keyword,
            @Param("categoryId") String categoryId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("instructorId") String instructorId,
            @Param("status") CourseStatus status,
            Pageable pageable
    );

    // Admin search - no status or user status filter
    @Query("SELECT DISTINCT c FROM Course c " +
            "LEFT JOIN c.categories cat " +
            "WHERE (:keyword IS NULL OR LOWER(c.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            "    OR LOWER(c.description) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:categoryId IS NULL OR cat.id = :categoryId) " +
            "AND (:minPrice IS NULL OR c.price >= :minPrice) " +
            "AND (:maxPrice IS NULL OR c.price <= :maxPrice) " +
            "AND (:instructorId IS NULL OR c.user.id = :instructorId)")
    Page<Course> searchAndFilterAdmin(
            @Param("keyword") String keyword,
            @Param("categoryId") String categoryId,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("instructorId") String instructorId,
            Pageable pageable
    );

    // Lấy tất cả khóa học của instructor
    @Query("SELECT c FROM Course c " +
            "WHERE c.user.id = :instructorId " +
            "ORDER BY c.createdAt DESC")
    List<Course> findAllByInstructorId(@Param("instructorId") String instructorId);

    // Tính rating trung bình của tất cả khóa học của instructor
    @Query("SELECT AVG(r.rating) FROM Review r " +
            "WHERE r.course.user.id = :instructorId")
    Double calculateAverageRatingByInstructor(@Param("instructorId") String instructorId);

    // Đếm tổng số khóa học của instructor
    @Query("SELECT COUNT(c) FROM Course c WHERE c.user.id = :instructorId")
    Long countCoursesByInstructor(@Param("instructorId") String instructorId);


}
