package com.example.Elearning.mapper;

import com.example.Elearning.dto.request.CreatedLessonRequest;
import com.example.Elearning.dto.response.CreatedLessonResponse;
import com.example.Elearning.dto.response.LessonResponse;
import com.example.Elearning.entity.Lesson;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface LessonMapper {
    CreatedLessonResponse toResponse(Lesson lesson);

    Lesson toEntity(CreatedLessonRequest request);
}
