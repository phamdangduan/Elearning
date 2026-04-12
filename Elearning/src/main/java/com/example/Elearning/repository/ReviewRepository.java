package com.example.Elearning.repository;

import com.example.Elearning.entity.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewRepository extends JpaRepository<Review, String> {
    Page<Review> findByCourse_Id(String courseId, Pageable pageable);
    Integer countByCourseId(String courseId);
    boolean existsByUser_IdAndCourse_Id(String userId, String courseId);
    Review findByUser_IdAndCourse_Id(String userId, String courseId);

    // Tính rating trung bình
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.course.id = :courseId")
    Double calculateAverageRating(@Param("courseId") String courseId);

    // Đếm tổng số review
    @Query("SELECT COUNT(r) FROM Review r WHERE r.course.id = :courseId")
    Long countReviewsByCourseId(@Param("courseId") String courseId);

}
