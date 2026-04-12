package com.example.Elearning.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class UpdateCourseRequest {
    @Size(min = 3, max = 200, message = "Title must be between 3 and 200 characters")
    String title;
    
    @Size(max = 2000, message = "Description must be less than 2000 characters")
    String description;
    
    BigDecimal price;
}
