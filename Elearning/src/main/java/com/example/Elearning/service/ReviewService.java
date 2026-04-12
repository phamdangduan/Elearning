package com.example.Elearning.service;

import com.example.Elearning.dto.PageResponse;
import com.example.Elearning.dto.request.CreateReviewRequest;
import com.example.Elearning.dto.response.ReviewResponse;
import org.springframework.data.domain.Pageable;

public interface ReviewService {
    ReviewResponse createReview(String userId, CreateReviewRequest createReviewRequest);
    PageResponse<ReviewResponse> getReviewsForCourse(String courseId, Pageable pageable);
    boolean hasUserReviewedCourse(String userId, String courseId);
    ReviewResponse getMyReview(String userId, String courseId);
}
