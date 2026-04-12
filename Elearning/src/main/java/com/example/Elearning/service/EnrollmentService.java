package com.example.Elearning.service;

import com.example.Elearning.dto.PageResponse;
import com.example.Elearning.dto.request.EnrollmentRequest;
import com.example.Elearning.dto.response.EnrollmentResponse;
import com.example.Elearning.dto.response.EnrollmentStatusResponse;
import com.example.Elearning.dto.response.MyEnrollmentResponse;
import org.springframework.data.domain.Pageable;

public interface EnrollmentService {
    EnrollmentResponse createEnrollment(EnrollmentRequest enrollmentRequest);
    PageResponse<MyEnrollmentResponse> getMyEnrollments(String userId, Pageable pageable);
    EnrollmentStatusResponse getEnrollmentStatus(String userId, String courseId);
    PageResponse<MyEnrollmentResponse> getInstructorStudents(String instructorId, Pageable pageable);
}
