package com.example.Elearning.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CourseStatsDetailResponse {
    String courseId;
    String courseTitle;
    String courseThumbnail;
    BigDecimal coursePrice;
    String courseStatus;  // ← THÊM FIELD NÀY (DRAFT, PUBLISHED, ARCHIVED)

    // Thống kê
    BigDecimal revenue;                // Doanh thu từ khóa học này
    Integer totalEnrollments;          // Số học sinh đã đăng ký
    BigDecimal averageRating;          // Rating trung bình
    Integer totalReviews;              // Tổng số review

    // Thời gian
    String createdAt;
}
