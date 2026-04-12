package com.example.Elearning.mapper;

import com.example.Elearning.dto.request.CreatedCourseRequest;
import com.example.Elearning.dto.request.UpdateCourseRequest;
import com.example.Elearning.dto.response.CourseDetailResponse;
import com.example.Elearning.dto.response.CourseResponse;
import com.example.Elearning.dto.response.CreatedCourseResponse;
import com.example.Elearning.entity.Category;
import com.example.Elearning.entity.Course;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface CourseMapper {
    Course toEntity(CreatedCourseRequest createdCourseRequest);

    CreatedCourseResponse toResponseCreated(Course course);
    
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "instructorId", source = "user.id")
    @Mapping(target = "instructorName", source = "user.profile.fullName")
    @Mapping(target = "status", expression = "java(course.getStatus() != null ? course.getStatus().name() : null)")
    @Mapping(target = "categoryIds", expression = "java(mapCategoriesToIds(course.getCategories()))")
    @Mapping(target = "categoryNames", expression = "java(mapCategoriesToNames(course.getCategories()))")
    CourseResponse toResponse(Course course);

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "status", expression = "java(course.getStatus() != null ? course.getStatus().name() : null)")
    @Mapping(target = "instructor", source = "user")
    CourseDetailResponse toCourseDetailResponse(Course course);

    void updateEntity(@MappingTarget Course course, UpdateCourseRequest request);

    default List<String> mapCategoriesToIds(List<Category> categories) {
        if (categories == null || categories.isEmpty()) {
            return new ArrayList<>();
        }
        return categories.stream()
                .map(Category::getId)
                .collect(Collectors.toList());
    }
    
    default List<String> mapCategoriesToNames(List<Category> categories) {
        if (categories == null || categories.isEmpty()) {
            return new ArrayList<>();
        }
        return categories.stream()
                .map(Category::getName)
                .collect(Collectors.toList());
    }
}
