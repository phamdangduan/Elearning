package com.example.Elearning.mapper;

import com.example.Elearning.dto.request.CreatedLessonRequest;
import com.example.Elearning.dto.response.CreatedLessonResponse;
import com.example.Elearning.entity.Lesson;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface LessonMapper {
    CreatedLessonResponse toResponse(Lesson lesson);

    Lesson toEntity(CreatedLessonRequest request);
}
