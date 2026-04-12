package com.example.Elearning.service;

import com.example.Elearning.dto.request.CompleteLessonRequest;
import com.example.Elearning.dto.response.ProgressResponse;

public interface LessonProgressService {
    Void completeLesson(String userId,CompleteLessonRequest completeLessonRequest);
    ProgressResponse getCourseProgress(String courseId,String userId);
}
