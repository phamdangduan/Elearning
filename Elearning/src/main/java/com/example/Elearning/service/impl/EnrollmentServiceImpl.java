package com.example.Elearning.service.impl;

import com.example.Elearning.dto.PageResponse;
import com.example.Elearning.dto.request.EnrollmentRequest;
import com.example.Elearning.dto.response.CourseResponse;
import com.example.Elearning.dto.response.EnrollmentResponse;
import com.example.Elearning.dto.response.EnrollmentStatusResponse;
import com.example.Elearning.dto.response.MyEnrollmentResponse;
import com.example.Elearning.entity.Course;
import com.example.Elearning.entity.Enrollment;
import com.example.Elearning.entity.User;
import com.example.Elearning.exception.AppException;
import com.example.Elearning.exception.ErrorCode;
import com.example.Elearning.mapper.EnrollmentMapper;
import com.example.Elearning.repository.*;
import com.example.Elearning.service.CourseEnrollmentService;
import com.example.Elearning.service.EnrollmentService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.exception.DataException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class EnrollmentServiceImpl implements EnrollmentService {
    EnrollmentRepository enrollmentRepository;
    EnrollmentMapper enrollmentMapper;
    UserRepository userRepository;
    CourseRepository courseRepository;
    CourseEnrollmentService courseEnrollmentService;
    LessonRepository lessonRepository;
    LessonProgressRepository lessonProgressRepository;


    @Override
    public EnrollmentResponse createEnrollment(EnrollmentRequest enrollmentRequest) {

        User user = userRepository.findById(enrollmentRequest.getUserId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (enrollmentRepository.existsByUser_IdAndCourse_Id(enrollmentRequest.getUserId(), enrollmentRequest.getCourseId())) {
            throw new AppException(ErrorCode.ALREADY_ENROLLED);
        }

        Course course = courseRepository.findById(enrollmentRequest.getCourseId())
                .orElseThrow(() ->
                        new AppException(ErrorCode.COURSE_NOT_FOUND));

        Enrollment enrollment = enrollmentMapper.toEntity(enrollmentRequest);

        enrollment.setUser(user);
        enrollment.setCourse(course);

        Enrollment savedEnrollment = enrollmentRepository.save(enrollment);

        courseEnrollmentService.updateCourseEnrollmentCount(enrollmentRequest.getCourseId());

        return enrollmentMapper.toResponse(savedEnrollment);
    }

    @Override
    public PageResponse<MyEnrollmentResponse> getMyEnrollments(String userId, Pageable pageable) {
        // 1️⃣ Lấy dữ liệu từ DB
        Page<Enrollment> enrollmentPage =
                enrollmentRepository.findByUser_Id(userId, pageable);

        List<MyEnrollmentResponse> responses = enrollmentPage
                .getContent()
                .stream()
                .map(enrollment -> {
                    MyEnrollmentResponse response = enrollmentMapper.toMyEnrollmentResponse(enrollment);

                    // Tính progress
                    String courseId = enrollment.getCourse().getId();
                    Long totalLessons = lessonRepository.countLessonsByCourse(courseId);
                    Long completedLessons = lessonProgressRepository
                            .countCompletedLessonsByCourse(userId, courseId);

                    log.info("Course: {}, Total Lessons: {}, Completed: {}", courseId, totalLessons, completedLessons);

                    double progress = 0.0;
                    if (totalLessons != null && totalLessons > 0) {
                        long completed = completedLessons != null ? completedLessons : 0;
                        progress = (completed * 100.0) / totalLessons;
                        progress = Math.round(progress * 100.0) / 100.0;
                    }

                    response.setProgress(progress);
                    log.info("Calculated progress for course {}: {}%", courseId, progress);

                    // Set instructor name
                    if (enrollment.getCourse().getUser() != null) {
                        response.setInstructorName(enrollment.getCourse().getUser().getUserName());
                    }

                    return response;
                })
                .collect(Collectors.toList());

        // 3️⃣ Build PageResponse
        return PageResponse.<MyEnrollmentResponse>builder()
                .content(responses)
                .pageNo(enrollmentPage.getNumber())
                .pageSize(enrollmentPage.getSize())
                .totalElement(enrollmentPage.getTotalElements())
                .totalPages(enrollmentPage.getTotalPages())
                .build();
    }

    @Override
    public EnrollmentStatusResponse getEnrollmentStatus(String userId, String courseId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        boolean isEnrolled =
                enrollmentRepository.existsByUser_IdAndCourse_Id(user.getId(), course.getId());

        return EnrollmentStatusResponse.builder()
                .isEnrolled(isEnrolled)
                .build();
    }

    @Override
    public PageResponse<MyEnrollmentResponse> getInstructorStudents(String instructorId, Pageable pageable) {
        // Lấy tất cả enrollment của các khóa học thuộc instructor
        Page<Enrollment> enrollmentPage = enrollmentRepository
                .findAllByInstructorIdWithPaging(instructorId, pageable);

        List<MyEnrollmentResponse> responses = enrollmentPage
                .getContent()
                .stream()
                .map(enrollment -> {
                    MyEnrollmentResponse response = enrollmentMapper.toMyEnrollmentResponse(enrollment);

                    // Tính progress
                    String courseId = enrollment.getCourse().getId();
                    String studentId = enrollment.getUser().getId();
                    
                    Long totalLessons = lessonRepository.countLessonsByCourse(courseId);
                    Long completedLessons = lessonProgressRepository
                            .countCompletedLessonsByCourse(studentId, courseId);

                    double progress = 0.0;
                    if (totalLessons != null && totalLessons > 0) {
                        long completed = completedLessons != null ? completedLessons : 0;
                        progress = (completed * 100.0) / totalLessons;
                        progress = Math.round(progress * 100.0) / 100.0;
                    }

                    response.setProgress(progress);

                    // Set student name (thay vì instructor name)
                    if (enrollment.getUser() != null) {
                        response.setInstructorName(enrollment.getUser().getUserName());
                    }

                    return response;
                })
                .collect(Collectors.toList());

        return PageResponse.<MyEnrollmentResponse>builder()
                .pageNo(enrollmentPage.getNumber())
                .pageSize(enrollmentPage.getSize())
                .totalPages(enrollmentPage.getTotalPages())
                .totalElement(enrollmentPage.getTotalElements())
                .content(responses)
                .build();
    }
}
