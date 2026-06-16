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

    @Mapping(target = "categoryIds", expression = "java(mapCategoriesToIds(course.getCategories()))")
    CreatedCourseResponse toResponseCreated(Course course);
    
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "instructorId", source = "user.id")
    @Mapping(target = "instructorName", source = "user.profile.fullName")
    @Mapping(target = "status", expression = "java(course.getStatus() != null ? course.getStatus().name() : null)")
    @Mapping(target = "categoryIds", expression = "java(mapCategoriesToIds(course.getCategories()))")
    @Mapping(target = "categoryNames", expression = "java(mapCategoriesToNames(course.getCategories()))")
    @Mapping(target = "totalStudents", source = "totalEnrollments")
    CourseResponse toResponse(Course course);

    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "status", expression = "java(course.getStatus() != null ? course.getStatus().name() : null)")
    @Mapping(target = "instructor", source = "user")
    @Mapping(target = "categoryIds", expression = "java(mapCategoriesToIds(course.getCategories()))")
    @Mapping(target = "categoryNames", expression = "java(mapCategoriesToNames(course.getCategories()))")
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

    default com.example.Elearning.dto.response.UserResponse mapUserToUserResponse(com.example.Elearning.entity.User user) {
        if (user == null) return null;
        com.example.Elearning.dto.response.UserResponse response = new com.example.Elearning.dto.response.UserResponse();
        response.setId(user.getId());
        response.setUserName(user.getUserName());
        response.setEmail(user.getEmail());
        if (user.getProfile() != null) {
            response.setFullName(user.getProfile().getFullName());
            response.setAvatar(user.getProfile().getAvatar());
            response.setBio(user.getProfile().getBio());
        }
        return response;
    }
}
