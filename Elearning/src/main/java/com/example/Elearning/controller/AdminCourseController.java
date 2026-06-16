package com.example.Elearning.controller;

import com.example.Elearning.dto.ApiResponse;
import com.example.Elearning.dto.response.CourseResponse;
import com.example.Elearning.enums.CourseStatus;
import com.example.Elearning.exception.AppException;
import com.example.Elearning.exception.ErrorCode;
import com.example.Elearning.exception.SuccessCode;
import com.example.Elearning.repository.CourseRepository;
import com.example.Elearning.repository.LessonProgressRepository;
import com.example.Elearning.repository.PaymentRequestRepository;
import com.example.Elearning.mapper.CourseMapper;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/admin/courses")
public class AdminCourseController {
    CourseRepository courseRepository;
    LessonProgressRepository lessonProgressRepository;
    PaymentRequestRepository paymentRequestRepository;
    CourseMapper courseMapper;

    @PutMapping("/{id}/approve")
    public ApiResponse<CourseResponse> approveCourse(@PathVariable String id) {
        var course = courseRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
        course.setStatus(CourseStatus.PUBLISHED);
        course.setUpdatedAt(java.time.LocalDateTime.now());
        var saved = courseRepository.save(course);
        return ApiResponse.ok(courseMapper.toResponse(saved), SuccessCode.UPDATED_COURSE);
    }

    @PutMapping("/{id}/reject")
    public ApiResponse<CourseResponse> rejectCourse(@PathVariable String id, @RequestBody Map<String, String> body) {
        var course = courseRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
        course.setStatus(CourseStatus.ARCHIVED); // Rejecting moves status to ARCHIVED
        course.setUpdatedAt(java.time.LocalDateTime.now());
        var saved = courseRepository.save(course);
        return ApiResponse.ok(courseMapper.toResponse(saved), SuccessCode.UPDATED_COURSE);
    }

    @PatchMapping("/{id}")
    public ApiResponse<CourseResponse> patchCourse(@PathVariable String id, @RequestBody Map<String, Object> body) {
        var course = courseRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
        if (body.containsKey("status")) {
            String statusStr = (String) body.get("status");
            course.setStatus(CourseStatus.valueOf(statusStr));
        }
        course.setUpdatedAt(java.time.LocalDateTime.now());
        var saved = courseRepository.save(course);
        return ApiResponse.ok(courseMapper.toResponse(saved), SuccessCode.UPDATED_COURSE);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ApiResponse<Void> deleteCourse(@PathVariable String id) {
        var course = courseRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
        
        // Clean up associated LessonProgress records
        lessonProgressRepository.deleteByCourseId(id);
        
        // Clean up associated PaymentRequest records
        paymentRequestRepository.deleteByCourseId(id);
        
        // Delete the course
        courseRepository.delete(course);
        
        return ApiResponse.ok(null, SuccessCode.DELETED_COURSE);
    }
}
