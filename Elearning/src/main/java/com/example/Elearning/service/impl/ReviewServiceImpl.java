package com.example.Elearning.service.impl;

import com.example.Elearning.dto.PageResponse;
import com.example.Elearning.dto.request.CreateReviewRequest;
import com.example.Elearning.dto.response.ProgressResponse;
import com.example.Elearning.dto.response.ReviewResponse;
import com.example.Elearning.entity.Review;
import com.example.Elearning.entity.User;
import com.example.Elearning.entity.Course;
import com.example.Elearning.exception.AppException;
import com.example.Elearning.exception.ErrorCode;
import com.example.Elearning.mapper.ReviewMapper;
import com.example.Elearning.repository.ReviewRepository;
import com.example.Elearning.repository.EnrollmentRepository;
import com.example.Elearning.repository.LessonRepository;
import com.example.Elearning.service.CourseRatingService;
import com.example.Elearning.service.ReviewService;
import com.example.Elearning.service.LessonProgressService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Service
public class ReviewServiceImpl implements ReviewService {
    ReviewRepository reviewRepository;
    ReviewMapper reviewMapper;
    CourseRatingService courseRatingService;
    EnrollmentRepository enrollmentRepository;
    LessonProgressService lessonProgressService;
    LessonRepository lessonRepository;
    @Override
    public ReviewResponse createReview(String userId, CreateReviewRequest createReviewRequest) {
        // Check if user already reviewed this course
        if (reviewRepository.existsByUser_IdAndCourse_Id(userId, createReviewRequest.getCourseId()))
            throw new AppException(ErrorCode.REVIEW_EXISTS);
        
        // Check if user is enrolled in the course
        if (!enrollmentRepository.existsByUser_IdAndCourse_Id(userId, createReviewRequest.getCourseId()))
            throw new AppException(ErrorCode.REVIEW_NOT_ENROLLED);
        
        // Check if user has completed the course (100%)
        ProgressResponse progress = lessonProgressService.getCourseProgress(createReviewRequest.getCourseId(), userId);
        long totalLessons = lessonRepository.countLessonsByCourse(createReviewRequest.getCourseId());
        long completedLessons = progress.getCompletedLessonIds() != null ? progress.getCompletedLessonIds().size() : 0;
        
        if (totalLessons > 0 && completedLessons < totalLessons) {
            throw new AppException(ErrorCode.REVIEW_COURSE_NOT_COMPLETED);
        }
        
        // Tạo Review với proxy objects
        Review review = new Review();
        review.setId(java.util.UUID.randomUUID().toString());
        
        // Tạo User proxy
        User user = new User();
        user.setId(userId);
        review.setUser(user);
        
        // Tạo Course proxy
        Course course = new Course();
        course.setId(createReviewRequest.getCourseId());
        review.setCourse(course);
        
        review.setRating(createReviewRequest.getRating());
        review.setComment(createReviewRequest.getComment());

        // Save review first
        Review savedReview = reviewRepository.save(review);
        
        // Then update course rating
        courseRatingService.updateCourseRating(createReviewRequest.getCourseId());
        
        return reviewMapper.toResponse(savedReview);
    }

    @Override
    public PageResponse<ReviewResponse> getReviewsForCourse(String courseId, Pageable pageable) {
        Page<Review> reviewPage = reviewRepository.findByCourse_Id(courseId, pageable);
        
        List<ReviewResponse> reviewResponses = reviewPage.stream()
                .map(reviewMapper::toResponse)
                .toList();
        
        return PageResponse.<ReviewResponse>builder()
                .content(reviewResponses)
                .totalElement(reviewPage.getTotalElements())
                .totalPages(reviewPage.getTotalPages())
                .pageNo(reviewPage.getNumber())
                .pageSize(reviewPage.getSize())
                .last(reviewPage.isLast())
                .build();
    }

    @Override
    public boolean hasUserReviewedCourse(String userId, String courseId) {
        return reviewRepository.existsByUser_IdAndCourse_Id(userId, courseId);
    }

    @Override
    public ReviewResponse getMyReview(String userId, String courseId) {
        Review review = reviewRepository.findByUser_IdAndCourse_Id(userId, courseId);
        return review != null ? reviewMapper.toResponse(review) : null;
    }
}
