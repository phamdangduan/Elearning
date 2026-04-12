package com.example.Elearning.repository;

import com.example.Elearning.entity.LessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LessonProgressRepository extends JpaRepository<LessonProgress,String> {
    boolean existsByUser_IdAndLesson_Id(String userId, String lessonId);
    List<LessonProgress> findByUser_IdAndCourse_Id(String userId, String courseId);

    // Đếm tổng số bài học đã hoàn thành của student
    @Query("SELECT COUNT(lp) FROM LessonProgress lp WHERE lp.user.id = :studentId")
    Long countCompletedLessonsByStudent(@Param("studentId") String studentId);

    // Đếm số bài đã hoàn thành trong 1 khóa học
    @Query("SELECT COUNT(lp) FROM LessonProgress lp " +
            "WHERE lp.user.id = :studentId AND lp.course.id = :courseId")
    Long countCompletedLessonsByCourse(@Param("studentId") String studentId,
                                       @Param("courseId") String courseId);

    // Lấy thời gian complete lesson gần nhất của student trong 1 khóa học
    @Query("SELECT MAX(lp.completeAt) FROM LessonProgress lp " +
            "WHERE lp.user.id = :studentId AND lp.course.id = :courseId")
    LocalDateTime findLastAccessedAtByCourse(@Param("studentId") String studentId,
                                             @Param("courseId") String courseId);

}
