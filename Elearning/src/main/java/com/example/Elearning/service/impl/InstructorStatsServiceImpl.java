package com.example.Elearning.service.impl;

import com.example.Elearning.dto.response.CourseStatsDetailResponse;
import com.example.Elearning.dto.response.InstructorStatsResponse;
import com.example.Elearning.entity.Course;
import com.example.Elearning.repository.CourseRepository;
import com.example.Elearning.repository.EnrollmentRepository;
import com.example.Elearning.repository.PaymentRequestRepository;
import com.example.Elearning.service.InstructorStatsService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class InstructorStatsServiceImpl implements InstructorStatsService {

    CourseRepository courseRepository;
    PaymentRequestRepository paymentRequestRepository;
    EnrollmentRepository enrollmentRepository;

    @Override
    public InstructorStatsResponse getInstructorStats(String instructorId) {
        // 1. Tính tổng doanh thu
        BigDecimal totalRevenue = paymentRequestRepository
                .calculateTotalRevenueByInstructor(instructorId);

        // 2. Đếm tổng số học sinh (unique)
        Long totalStudents = enrollmentRepository
                .countUniqueStudentsByInstructor(instructorId);

        // 3. Đếm tổng số khóa học
        Long totalCourses = courseRepository
                .countCoursesByInstructor(instructorId);

        // 4. Tính rating trung bình của tất cả khóa học
        Double avgRating = courseRepository
                .calculateAverageRatingByInstructor(instructorId);
        BigDecimal averageRating = avgRating != null
                ? BigDecimal.valueOf(avgRating).setScale(2, RoundingMode.HALF_UP)
                : null;

        // 5. Lấy thống kê chi tiết từng khóa học
        List<Course> courses = courseRepository.findAllByInstructorId(instructorId);
        List<CourseStatsDetailResponse> courseStats = courses.stream()
                .map(this::mapToCourseStatsDetail)
                .collect(Collectors.toList());

        // 6. Build response
        return InstructorStatsResponse.builder()
                .totalRevenue(totalRevenue)
                .totalStudents(totalStudents.intValue())
                .totalCourses(totalCourses.intValue())
                .averageRating(averageRating)
                .courseStats(courseStats)
                .build();
    }

    // Helper method: Convert Course entity sang CourseStatsDetail
    private CourseStatsDetailResponse mapToCourseStatsDetail(Course course) {
        // Tính doanh thu từ khóa học này
        BigDecimal revenue = paymentRequestRepository
                .calculateRevenueByCourse(course.getId());

        // Format datetime
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        String createdAt = course.getCreatedAt() != null
                ? course.getCreatedAt().format(formatter)
                : null;

        return CourseStatsDetailResponse.builder()
                .courseId(course.getId())
                .courseTitle(course.getTitle())
                .courseThumbnail(course.getThumbnailUrl())
                .coursePrice(course.getPrice())
                .courseStatus(course.getStatus() != null ? course.getStatus().name() : "DRAFT")  // ← THÊM DÒNG NÀY
                .revenue(revenue)
                .totalEnrollments(course.getTotalEnrollments())
                .averageRating(course.getAverageRating())
                .totalReviews(course.getTotalReviews())
                .createdAt(createdAt)
                .build();
    }
}
