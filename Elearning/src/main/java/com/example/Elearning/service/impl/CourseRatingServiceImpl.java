package com.example.Elearning.service.impl;

import com.example.Elearning.entity.Course;
import com.example.Elearning.exception.AppException;
import com.example.Elearning.exception.ErrorCode;
import com.example.Elearning.repository.CourseRepository;
import com.example.Elearning.repository.ReviewRepository;
import com.example.Elearning.service.CourseRatingService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CourseRatingServiceImpl implements CourseRatingService {

    CourseRepository courseRepository;
    ReviewRepository reviewRepository;

    @Override
    public void updateCourseRating(String courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        Double avgRating = reviewRepository.calculateAverageRating(courseId);
        Long totalReviews = reviewRepository.countReviewsByCourseId(courseId);

        if (avgRating != null) {
            BigDecimal roundedRating = BigDecimal.valueOf(avgRating)
                    .setScale(2, RoundingMode.HALF_UP);
            course.setAverageRating(roundedRating);
        } else {
            course.setAverageRating(BigDecimal.ZERO);
        }

        course.setTotalReviews(totalReviews.intValue());
        courseRepository.save(course);
    }
}
