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

    // Sort theo field nào (title, price, createdAt)
    String sortBy; // Ví dụ: "price", "createdAt", "title"

    // Sort tăng dần hay giảm dần
    String sortDirection; // "ASC" hoặc "DESC"
}
