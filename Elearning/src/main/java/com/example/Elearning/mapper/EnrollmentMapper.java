package com.example.Elearning.mapper;

import com.example.Elearning.dto.request.CreatedLessonRequest;
import com.example.Elearning.dto.request.EnrollmentRequest;
import com.example.Elearning.dto.response.EnrollmentResponse;
import com.example.Elearning.dto.response.MyEnrollmentResponse;
import com.example.Elearning.entity.Enrollment;
import com.example.Elearning.entity.Lesson;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface EnrollmentMapper {

    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "course.id", target = "courseId")
    EnrollmentResponse toResponse(Enrollment enrollment);

    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "course.id", target = "courseId")
    @Mapping(source = "course.title", target = "courseTitle")
    @Mapping(source = "course.thumbnailUrl", target = "courseThumbnailUrl")
    MyEnrollmentResponse toMyEnrollmentResponse(Enrollment enrollment);

    Enrollment toEntity(EnrollmentRequest request);
}
