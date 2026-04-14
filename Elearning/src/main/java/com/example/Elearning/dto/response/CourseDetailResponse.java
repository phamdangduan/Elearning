package com.example.Elearning.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class CourseDetailResponse {
    String id;
    String title;
    String description;
    BigDecimal price;
    String thumbnailUrl;
    String userId;
    String status;
    UserResponse instructor;
    List<SectionResponse> sections;
    BigDecimal averageRating;
    Integer totalReviews;
    Integer totalEnrollments;
    Integer totalLessons;
    Integer totalDurationSeconds;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
