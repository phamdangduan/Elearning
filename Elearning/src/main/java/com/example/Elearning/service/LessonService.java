package com.example.Elearning.service;

import com.example.Elearning.dto.request.CreatedLessonRequest;
import com.example.Elearning.dto.request.UpdateLessonRequest;
import com.example.Elearning.dto.response.CreatedLessonResponse;

public interface LessonService {
    CreatedLessonResponse createdLesson(String sectionId,String instructorId, CreatedLessonRequest request);
    Void deleteLesson(String lessonId,String instructorId);
    CreatedLessonResponse updateLesson(String lessonId,String instructorId, UpdateLessonRequest request);
}
