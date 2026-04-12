package com.example.Elearning.service.impl;

import com.example.Elearning.dto.request.CompleteLessonRequest;
import com.example.Elearning.dto.response.ProgressResponse;
import com.example.Elearning.entity.LessonProgress;
import com.example.Elearning.exception.AppException;
import com.example.Elearning.exception.ErrorCode;
import com.example.Elearning.repository.EnrollmentRepository;
import com.example.Elearning.repository.LessonProgressRepository;
import com.example.Elearning.service.LessonProgressService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import com.example.Elearning.entity.User;
import com.example.Elearning.entity.Course;
import com.example.Elearning.entity.Section;
import com.example.Elearning.entity.Lesson;


@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class LessonProgressServiceImpl implements LessonProgressService {
    LessonProgressRepository lessonProgressRepository;
    EnrollmentRepository enrollmentRepository;

    @Override
    public Void completeLesson(String userId, CompleteLessonRequest request) {
        // 1. Kiểm tra đã complete chưa
        if (lessonProgressRepository.existsByUser_IdAndLesson_Id(userId, request.getLessonId())) {
            return null;
        }

        // 2. Kiểm tra đã enroll chưa
        boolean isEnrolled = enrollmentRepository.existsByUser_IdAndCourse_Id(userId, request.getCourseId());

        if (!isEnrolled) {
            throw new AppException(ErrorCode.REGISTERED);
        }

        // 3. ✅ Tạo LessonProgress đúng cách
        LessonProgress progress = new LessonProgress();
        progress.setId(UUID.randomUUID().toString());

        // Tạo User object (proxy)
        User user = new User();
        user.setId(userId);
        progress.setUser(user);  // ✅ Set object, không phải String

        // Tạo Course object (proxy)
        Course course = new Course();
        course.setId(request.getCourseId());
        progress.setCourse(course);

        // Tạo Section object (proxy)
        Section section = new Section();
        section.setId(request.getSectionId());
        progress.setSection(section);

        // Tạo Lesson object (proxy)
        Lesson lesson = new Lesson();
        lesson.setId(request.getLessonId());
        progress.setLesson(lesson);

        // completeAt sẽ tự động set trong @PrePersist

        lessonProgressRepository.save(progress);

        return null;
    }

    @Override
    public ProgressResponse getCourseProgress(String courseId, String userId) {
        List<LessonProgress> lessonProgresses = lessonProgressRepository
                .findByUser_IdAndCourse_Id(userId, courseId);
        List<String> completedLessonIds = lessonProgresses.stream()
                .map(progress -> progress.getLesson().getId()).toList();
        return ProgressResponse.builder()
                .completedLessonIds(completedLessonIds)
                .build();
    }
    

}
