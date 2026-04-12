package com.example.Elearning.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StudentCourseProgressResponse {
    String courseId;
    String courseTitle;
    String courseThumbnail;
    String instructorName;

    Integer totalLessons;              // Tổng số bài học trong khóa
    Integer completedLessons;          // Số bài đã hoàn thành
    Double progressPercentage;         // % tiến độ (0-100)

    String enrolledAt;                 // Ngày đăng ký
    String lastAccessedAt;             // Lần học gần nhất (complete lesson gần nhất)
}
