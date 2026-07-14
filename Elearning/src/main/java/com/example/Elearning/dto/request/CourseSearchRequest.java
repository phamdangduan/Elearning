package com.example.Elearning.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;
import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CourseSearchRequest {

    // Tìm kiếm theo keyword (title, description)
    String keyword;

    // Filter theo category
    String categoryId;

    // Filter theo giá
    BigDecimal minPrice;
    BigDecimal maxPrice;

    // Filter theo instructor
    String instructorId;

    // Phân trang & Sắp xếp
    @Builder.Default
    Integer pageNo = 0;

    @Builder.Default
    Integer pageSize = 10;

    @Builder.Default
    String sortBy = "createdAt";

    @Builder.Default
    String sortDirection = "DESC";
}

