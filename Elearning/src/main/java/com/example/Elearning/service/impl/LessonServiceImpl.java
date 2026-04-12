package com.example.Elearning.service.impl;

import com.example.Elearning.dto.request.CreatedLessonRequest;
import com.example.Elearning.dto.request.UpdateLessonRequest;
import com.example.Elearning.dto.response.CreatedLessonResponse;
import com.example.Elearning.entity.Lesson;
import com.example.Elearning.exception.AppException;
import com.example.Elearning.exception.ErrorCode;
import com.example.Elearning.mapper.LessonMapper;
import com.example.Elearning.repository.LessonRepository;
import com.example.Elearning.service.LessonService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j

public class LessonServiceImpl implements LessonService {

    LessonMapper lessonMapper;
    LessonRepository lessonRepository;
    SectionServiceImpl sectionService;

    @Override
    public CreatedLessonResponse createdLesson(String sectionId,String instructorId, CreatedLessonRequest request) {
        var section = sectionService.getSectionById(sectionId);
        if (!section.getCourse().getUser().getId().equals(instructorId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        var lesson = lessonMapper.toEntity(request);
        lesson.setSection(section);
        var orderIndex = lessonRepository.countBySectionId(sectionId);
        lesson.setOrderIndex(orderIndex);
        return lessonMapper.toResponse(lessonRepository.save(lesson));
    }

    @Override
    public Void deleteLesson(String lessonId,String instructorId) {
        var lesson = this.getLessonById(lessonId);

        if (!lesson.getSection().getCourse().getUser().getId().equals(instructorId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        lessonRepository.delete(lesson);
        return null;
    }

    @Override
    public CreatedLessonResponse updateLesson(String lessonId,String instructorId, UpdateLessonRequest request) {
        var lesson = this.getLessonById(lessonId);
        if (!lesson.getSection().getCourse().getUser().getId().equals(instructorId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        lesson.setTitle(request.getTitle());
        return lessonMapper.toResponse(lessonRepository.save(lesson));
    }

    private Lesson getLessonById(String lessonId) {
        return lessonRepository.findById(lessonId)
                .orElseThrow(() -> new AppException(ErrorCode.LESSON_NOT_FOUND));
    }
}
