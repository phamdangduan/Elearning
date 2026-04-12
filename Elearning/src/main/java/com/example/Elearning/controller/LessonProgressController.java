package com.example.Elearning.controller;

import com.example.Elearning.dto.ApiResponse;
import com.example.Elearning.dto.request.CompleteLessonRequest;
import com.example.Elearning.dto.request.EnrollmentRequest;
import com.example.Elearning.dto.response.ProgressResponse;
import com.example.Elearning.exception.SuccessCode;
import com.example.Elearning.service.impl.LessonProgressServiceImpl;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/lessonprogess")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class LessonProgressController {
    LessonProgressServiceImpl lessonProgressService;

    @PostMapping("/complete-lesson")
    ApiResponse<Void> completeLesson(@RequestParam String userId, @RequestBody @Valid CompleteLessonRequest completeLessonRequest){
        lessonProgressService.completeLesson(userId,completeLessonRequest);
        return ApiResponse.ok(null, SuccessCode.COMPLETE_LESSON_SUCCESS);
    }

    @GetMapping
    ApiResponse<ProgressResponse> getCourseProgress(@RequestParam String courseId, @RequestParam String userId){
        return ApiResponse.ok(lessonProgressService.getCourseProgress(courseId,userId), SuccessCode.GET_COURSE_PROGRESS_SUCCESS);
    }

}
