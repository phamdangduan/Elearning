package com.example.Elearning.service.impl;


import com.example.Elearning.entity.Course;
import com.example.Elearning.exception.AppException;
import com.example.Elearning.exception.ErrorCode;
import com.example.Elearning.repository.CourseRepository;
import com.example.Elearning.repository.EnrollmentRepository;
import com.example.Elearning.service.CourseEnrollmentService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CourseEnrollmentServiceImpl implements CourseEnrollmentService {

    CourseRepository courseRepository;
    EnrollmentRepository enrollmentRepository;

    @Override
    public void updateCourseEnrollmentCount(String courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        Long totalEnrollments = enrollmentRepository.countEnrollmentsByCourseId(courseId);

        course.setTotalEnrollments(totalEnrollments.intValue());
        courseRepository.save(course);

    }
}
