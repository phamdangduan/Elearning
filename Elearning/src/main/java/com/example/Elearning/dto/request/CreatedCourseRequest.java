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

    @Size(max = 200, message = "Description must be less than 200 characters")
    String description;

    @URL(message = "URL ảnh bìa không hợp lệ")
    String thumbnailUrl;

    BigDecimal price;

    @NonNull
    List<String> categoryIds;
}
