package com.example.Elearning.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class InstructorStatsResponse {
    // Thống kê tổng quan
    BigDecimal totalRevenue;           // Tổng doanh thu
    Integer totalStudents;             // Tổng số học sinh
    Integer totalCourses;              // Tổng số khóa học
    BigDecimal averageRating;          // Rating trung bình của tất cả khóa học

    // Thống kê chi tiết theo khóa học
    List<CourseStatsDetailResponse> courseStats;
}
