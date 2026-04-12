package com.example.Elearning.service.impl;

import com.example.Elearning.dto.response.StudentCourseProgressResponse;
import com.example.Elearning.dto.response.StudentStatsResponse;
import com.example.Elearning.entity.Enrollment;
import com.example.Elearning.repository.EnrollmentRepository;
import com.example.Elearning.repository.LessonProgressRepository;
import com.example.Elearning.repository.LessonRepository;
import com.example.Elearning.service.StudentStatsService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class StudentStatsServiceImpl implements StudentStatsService {

    EnrollmentRepository enrollmentRepository;
    LessonProgressRepository lessonProgressRepository;
    LessonRepository lessonRepository;

    @Override
    public StudentStatsResponse getStudentStats(String studentId) {
        // 1. Đếm tổng số khóa học đã đăng ký
        Long totalEnrolledCourses = enrollmentRepository
                .countEnrollmentsByStudent(studentId);

        // 2. Đếm tổng số bài học đã hoàn thành
        Long totalCompletedLessons = lessonProgressRepository
                .countCompletedLessonsByStudent(studentId);

        // 3. Lấy danh sách enrollment với course info
        List<Enrollment> enrollments = enrollmentRepository
                .findAllByStudentIdWithCourse(studentId);

        // 4. Tính toán tiến độ từng khóa học
        List<StudentCourseProgressResponse> courseProgressList = enrollments.stream()
                .map(enrollment -> calculateCourseProgress(studentId, enrollment))
                .collect(Collectors.toList());

        // 5. Đếm số khóa học đang học vs đã hoàn thành
        long completedCourses = courseProgressList.stream()
                .filter(cp -> cp.getProgressPercentage() >= 100.0)
                .count();

        long inProgressCourses = courseProgressList.stream()
                .filter(cp -> cp.getProgressPercentage() > 0 && cp.getProgressPercentage() < 100.0)
                .count();

        // 6. Build response
        return StudentStatsResponse.builder()
                .totalEnrolledCourses(totalEnrolledCourses.intValue())
                .totalCompletedLessons(totalCompletedLessons.intValue())
                .totalInProgressCourses((int) inProgressCourses)
                .totalCompletedCourses((int) completedCourses)
                .courseProgress(courseProgressList)
                .build();
    }

    // Helper method: Tính tiến độ 1 khóa học
    private StudentCourseProgressResponse calculateCourseProgress(String studentId, Enrollment enrollment) {
        String courseId = enrollment.getCourse().getId();

        // Đếm tổng số lesson trong khóa học
        Long totalLessons = lessonRepository.countLessonsByCourse(courseId);

        // Đếm số lesson đã hoàn thành
        Long completedLessons = lessonProgressRepository
                .countCompletedLessonsByCourse(studentId, courseId);

        // Tính % tiến độ
        double progressPercentage = 0.0;
        if (totalLessons > 0) {
            progressPercentage = (completedLessons * 100.0) / totalLessons;
            // Làm tròn 2 chữ số thập phân
            progressPercentage = Math.round(progressPercentage * 100.0) / 100.0;
        }

        // Lấy thời gian học gần nhất
        LocalDateTime lastAccessedAt = lessonProgressRepository
                .findLastAccessedAtByCourse(studentId, courseId);

        // Format datetime
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        String enrolledAtStr = enrollment.getEnrollmentDate() != null
                ? enrollment.getEnrollmentDate().format(formatter)
                : null;
        String lastAccessedAtStr = lastAccessedAt != null
                ? lastAccessedAt.format(formatter)
                : null;

        // Lấy tên instructor
        String instructorName = enrollment.getCourse().getUser() != null
                ? enrollment.getCourse().getUser().getUserName()
                : "Unknown";

        return StudentCourseProgressResponse.builder()
                .courseId(courseId)
                .courseTitle(enrollment.getCourse().getTitle())
                .courseThumbnail(enrollment.getCourse().getThumbnailUrl())
                .instructorName(instructorName)
                .totalLessons(totalLessons.intValue())
                .completedLessons(completedLessons.intValue())
                .progressPercentage(progressPercentage)
                .enrolledAt(enrolledAtStr)
                .lastAccessedAt(lastAccessedAtStr)
                .build();
    }
}
