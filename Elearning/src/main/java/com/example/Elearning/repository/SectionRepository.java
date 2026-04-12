package com.example.Elearning.repository;

import com.example.Elearning.entity.Section;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SectionRepository extends JpaRepository<Section, String> {
    @Query("SELECT MAX(s.orderIndex) FROM Section s WHERE s.course.id = :courseId")
    Integer findMaxOrderIndexByCourseId(@Param("courseId") String courseId);

    int countByCourseId(String courseId);
}
