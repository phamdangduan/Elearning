package com.example.Elearning.controller;

import com.example.Elearning.dto.ApiResponse;
import com.example.Elearning.dto.PageResponse;
import com.example.Elearning.dto.request.EnrollmentRequest;
import com.example.Elearning.dto.response.EnrollmentResponse;
import com.example.Elearning.dto.response.EnrollmentStatusResponse;
import com.example.Elearning.dto.response.MyEnrollmentResponse;
import com.example.Elearning.exception.SuccessCode;
import com.example.Elearning.security.CurrentUser;
import com.example.Elearning.service.impl.EnrollmentServiceImpl;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/enrollment")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class EnrollmentController {
    EnrollmentServiceImpl enrollmentService;

    @PostMapping
    public ApiResponse<EnrollmentResponse> createEnrollment(@RequestBody @Valid EnrollmentRequest enrollmentRequest) {
        enrollmentRequest.setUserId(CurrentUser.resolve(enrollmentRequest.getUserId()));
        return ApiResponse.ok(enrollmentService.createEnrollment(enrollmentRequest), SuccessCode.ENROLLMENT_SUCCESS);
    }

    @GetMapping("/my-enrollment")
    ApiResponse<PageResponse<MyEnrollmentResponse>> getMyEnrollments(@RequestParam(required = false) String userId, Pageable pageable) {
        userId = CurrentUser.resolve(userId);
        return ApiResponse.ok(enrollmentService.getMyEnrollments(userId,pageable), SuccessCode.GET_MY_ENROLLMENT_SUCCESS);
    }

    @GetMapping("/instructor-students")
    ApiResponse<PageResponse<MyEnrollmentResponse>> getInstructorStudents(
            @RequestParam(required = false) String instructorId, 
            Pageable pageable) {
        instructorId = CurrentUser.resolve(instructorId);
        return ApiResponse.ok(
                enrollmentService.getInstructorStudents(instructorId, pageable), 
                SuccessCode.GET_MY_ENROLLMENT_SUCCESS
        );
    }

    @GetMapping("/status")
    ApiResponse<EnrollmentStatusResponse> getEnrollmentStatus(@RequestParam(required = false) String userId, @RequestParam String courseId) {
        userId = CurrentUser.resolve(userId);
        return ApiResponse.ok(enrollmentService.getEnrollmentStatus(userId,courseId), SuccessCode.ENROLLMENT_SUCCESS);
    }
}
