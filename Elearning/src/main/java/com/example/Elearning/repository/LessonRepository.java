package com.example.Elearning.repository;

import com.example.Elearning.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, String> {
    int countBySectionId(String sectionId);

    // Đếm tổng số lesson trong 1 khóa học
    @Query("SELECT COUNT(l) FROM Lesson l " +
            "WHERE l.section.course.id = :courseId")
    Long countLessonsByCourse(@Param("courseId") String courseId);

}
