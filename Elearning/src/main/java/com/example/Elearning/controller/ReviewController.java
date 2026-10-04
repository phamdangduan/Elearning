package com.example.Elearning.controller;

import com.example.Elearning.dto.ApiResponse;
import com.example.Elearning.dto.PageResponse;
import com.example.Elearning.dto.request.CreateReviewRequest;
import com.example.Elearning.dto.response.ReviewResponse;
import com.example.Elearning.exception.SuccessCode;
import com.example.Elearning.security.CurrentUser;
import com.example.Elearning.service.impl.ReviewServiceImpl;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@RestController
@RequestMapping("/review")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ReviewController {
    ReviewServiceImpl reviewService;
    @PostMapping("/create")
    ApiResponse<ReviewResponse> createReview(@RequestParam(required = false) String userId, @Valid @RequestBody CreateReviewRequest createReviewRequest){
        userId = CurrentUser.resolve(userId);
        return ApiResponse.ok(reviewService.createReview(userId, createReviewRequest), SuccessCode.REVIEW_CREATED);
    }
    
    @GetMapping("/check-reviewed")
    ApiResponse<Boolean> checkIfUserReviewed(@RequestParam(required = false) String userId, @RequestParam String courseId){
        userId = CurrentUser.resolve(userId);
        return ApiResponse.ok(reviewService.hasUserReviewedCourse(userId, courseId), SuccessCode.GET_REVIEWS_SUCCESS);
    }
    
    @GetMapping("/my-review")
    ApiResponse<ReviewResponse> getMyReview(@RequestParam(required = false) String userId, @RequestParam String courseId){
        userId = CurrentUser.resolve(userId);
        return ApiResponse.ok(reviewService.getMyReview(userId, courseId), SuccessCode.GET_REVIEWS_SUCCESS);
    }
    
    @GetMapping("/get-reviewsForCourse")
        ApiResponse<PageResponse<ReviewResponse>> getReviewsForCourse(@RequestParam String courseId, Pageable pageable){
        return ApiResponse.ok(reviewService.getReviewsForCourse(courseId, pageable), SuccessCode.GET_REVIEWS_SUCCESS);
    }
}
