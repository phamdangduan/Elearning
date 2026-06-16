package com.example.Elearning.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.validator.constraints.URL;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class CreatedCourseRequest {
    @NotBlank(message = "Title must not be blank")

    @Size(min = 3, max = 100, message = "Title must be between 3 and 100 characters")
    String title;

    @Size(max = 2000, message = "Description must be less than 2000 characters")
    String description;

    String thumbnailUrl;  // Removed @URL validation to allow empty string or null

    BigDecimal price;

    @NonNull
    List<String> categoryIds;
}
