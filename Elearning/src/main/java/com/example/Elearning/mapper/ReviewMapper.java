package com.example.Elearning.mapper;

import com.example.Elearning.dto.response.ReviewResponse;
import com.example.Elearning.entity.Review;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ReviewMapper {
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "courseId", source = "course.id")
    @Mapping(target = "userName", source = "user.userName")
    @Mapping(target = "avatar", ignore = true)
    ReviewResponse toResponse(Review review);
}