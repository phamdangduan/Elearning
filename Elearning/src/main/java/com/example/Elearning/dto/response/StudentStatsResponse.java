package com.example.Elearning.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StudentStatsResponse {
    // Thống kê tổng quan
    Integer totalEnrolledCourses;      // Tổng số khóa học đã đăng ký
    Integer totalCompletedLessons;     // Tổng số bài học đã hoàn thành
    Integer totalInProgressCourses;    // Số khóa học đang học (chưa hoàn thành 100%)
    Integer totalCompletedCourses;     // Số khóa học đã hoàn thành 100%

    // Thống kê chi tiết từng khóa học
    List<StudentCourseProgressResponse> courseProgress;
}
