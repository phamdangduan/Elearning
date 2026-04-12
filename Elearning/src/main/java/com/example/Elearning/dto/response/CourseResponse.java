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
public class CourseResponse {
    String id;
    String title;
    String description;
    BigDecimal price;
    String thumbnailUrl;
    String userId;
    String instructorId;  // Same as userId, for clarity
    String instructorName;  // Full name of instructor
    String status;
    List<String> categoryIds;
    List<String> categoryNames;  // Add category names
    //List<SectionResponse> sections;
    BigDecimal averageRating;
    Integer totalReviews;
    Integer totalEnrollments;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
