package com.example.Elearning.controller;

import com.example.Elearning.dto.ApiResponse;
import com.example.Elearning.dto.PageResponse;
import com.example.Elearning.dto.request.CourseSearchRequest;
import com.example.Elearning.dto.request.CreatedCourseRequest;
import com.example.Elearning.dto.request.UpdateCourseRequest;
import com.example.Elearning.dto.request.UploadThumbnailRequest;
import com.example.Elearning.dto.response.CourseDetailResponse;
import com.example.Elearning.dto.response.CourseResponse;
import com.example.Elearning.dto.response.CreatedCourseResponse;
import com.example.Elearning.dto.response.FileUploadResponse;
import com.example.Elearning.entity.Course;
import com.example.Elearning.exception.AppException;
import com.example.Elearning.exception.ErrorCode;
import com.example.Elearning.exception.SuccessCode;
import com.example.Elearning.service.CourseService;
import com.example.Elearning.service.FileStorageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;

@RestController
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/course")
public class CourseController {
    CourseService courseService;
    FileStorageService fileStorageService;
    com.example.Elearning.repository.CourseRepository courseRepository;
    com.example.Elearning.repository.ReviewRepository reviewRepository;
    com.example.Elearning.mapper.CourseMapper courseMapper;
    
    @GetMapping("/get")
    ApiResponse<PageResponse<CourseResponse>> getCourseWithStatusByUser(@RequestParam String userId, Pageable pageable){
        return ApiResponse.ok(courseService.getCourseWithStatusByUserId(userId, pageable), SuccessCode.GET_MY_COURSE_SUCCESS);
    }

    @GetMapping
    ApiResponse<PageResponse<CourseResponse>> getAllCoursesByPublish(Pageable pageable){
        return ApiResponse.ok( courseService.getAllCourseStatusPublish(pageable), SuccessCode.GET_COURSE_PUBLISH_SUCCESS);
    }

    @GetMapping("/teacher")
    ApiResponse<PageResponse<CourseResponse>> getCourseMy(@RequestParam String userId,Pageable pageable){
        return ApiResponse.ok(courseService.getCourseMy(userId,pageable), SuccessCode.GET_MY_COURSE_SUCCESS);
    }

    @GetMapping("/{courseId}")
    ApiResponse<CourseDetailResponse> getCourseDetail(@PathVariable String courseId) {
        return ApiResponse.ok(courseService.getCourseDetail(courseId), SuccessCode.GET_COURSE_DETAIL_SUCCESS);
    }

    @GetMapping("/{courseId}/student")
    ApiResponse<CourseDetailResponse> getCourseDetailForStudent(
            @PathVariable String courseId,
            @RequestParam String studentId) {
        return ApiResponse.ok(courseService.getCourseDetailForStudent(courseId, studentId), SuccessCode.GET_COURSE_DETAIL_SUCCESS);
    }

    @PostMapping("/create")
    public ApiResponse<CreatedCourseResponse> createCourse(@RequestParam String userId, @Valid @RequestBody CreatedCourseRequest request) {
        return ApiResponse.ok(courseService.createCourse(userId, request), SuccessCode.CREATED_COURSE);
    }

    @PatchMapping("/{courseId}/thumbnail")
    ApiResponse<CourseResponse> uploadThumbnail(@PathVariable String courseId,
                                                @RequestParam String instructorId,
                                                @Valid @RequestBody UploadThumbnailRequest request) {
        return ApiResponse.ok(courseService.uploadThumbnail(courseId, instructorId ,request), SuccessCode.UPDATED_COURSE);
    }

    @PutMapping("/{courseId}/update")
    ApiResponse<CourseResponse> updateCourse(@PathVariable String courseId,
                                             @RequestParam String instructorId,
                                             @Valid @RequestBody UpdateCourseRequest request) {
        return ApiResponse.ok(courseService.updateCourse(courseId,instructorId, request), SuccessCode.UPDATED_COURSE);
    }

    @PatchMapping("/{courseId}/publish")
    ApiResponse<CourseResponse> publishCourse(@PathVariable String courseId,
                                              @RequestParam String instructorId) {
        return ApiResponse.ok(courseService.publishCourse(courseId,instructorId), SuccessCode.UPDATED_COURSE);
    }

    @DeleteMapping("/{courseId}")
    ApiResponse<Void> deleteCourse(@PathVariable String courseId,
                                   @RequestParam String instructorId) {
        return ApiResponse.ok(courseService.deleteCourse(courseId,instructorId), SuccessCode.DELETED_COURSE);
    }

    // Thêm method này (tương tự lesson)
    @PostMapping(value = "/upload-thumbnail", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<FileUploadResponse> uploadThumbnail(
            @RequestPart("image") MultipartFile imageFile,
            @RequestParam String instructorId) {

        if (instructorId == null || instructorId.isEmpty()) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        FileUploadResponse response = fileStorageService.uploadImage(imageFile, "courses");
        return ApiResponse.ok(response, SuccessCode.FILE_UPLOADED);
    }


    // THÊM ENDPOINT MỚI
    @GetMapping("/search")
    ApiResponse<PageResponse<CourseResponse>> searchAndFilterCourses(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String minPrice,  // ← Đổi sang String
            @RequestParam(required = false) String maxPrice,  // ← Đổi sang String
            @RequestParam(required = false) String instructorId,
            Pageable pageable) {

        // Convert String sang BigDecimal
        BigDecimal minPriceValue = null;
        BigDecimal maxPriceValue = null;

        if (minPrice != null && !minPrice.isEmpty()) {
            try {
                minPriceValue = new BigDecimal(minPrice);
            } catch (NumberFormatException e) {
                throw new AppException(ErrorCode.VALIDATION_ERROR);
            }
        }

        if (maxPrice != null && !maxPrice.isEmpty()) {
            try {
                maxPriceValue = new BigDecimal(maxPrice);
            } catch (NumberFormatException e) {
                throw new AppException(ErrorCode.VALIDATION_ERROR);
            }
        }

        // Tạo search request từ params
        CourseSearchRequest searchRequest = CourseSearchRequest.builder()
                .keyword(keyword)
                .categoryId(categoryId)
                .minPrice(minPriceValue)
                .maxPrice(maxPriceValue)
                .instructorId(instructorId)
                .build();

        return ApiResponse.ok(
                courseService.searchAndFilterCourses(searchRequest, pageable),
                SuccessCode.GET_COURSE_SUCCESS
        );
    }

    // Admin endpoint - no status filter
    @GetMapping("/search/admin")
    ApiResponse<PageResponse<CourseResponse>> searchAndFilterCoursesAdmin(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String minPrice,
            @RequestParam(required = false) String maxPrice,
            @RequestParam(required = false) String instructorId,
            Pageable pageable) {

        BigDecimal minPriceValue = null;
        BigDecimal maxPriceValue = null;

        if (minPrice != null && !minPrice.isEmpty()) {
            try {
                minPriceValue = new BigDecimal(minPrice);
            } catch (NumberFormatException e) {
                throw new AppException(ErrorCode.VALIDATION_ERROR);
            }
        }

        if (maxPrice != null && !maxPrice.isEmpty()) {
            try {
                maxPriceValue = new BigDecimal(maxPrice);
            } catch (NumberFormatException e) {
                throw new AppException(ErrorCode.VALIDATION_ERROR);
            }
        }

        CourseSearchRequest searchRequest = CourseSearchRequest.builder()
                .keyword(keyword)
                .categoryId(categoryId)
                .minPrice(minPriceValue)
                .maxPrice(maxPriceValue)
                .instructorId(instructorId)
                .build();

        return ApiResponse.ok(
                courseService.searchAndFilterCoursesAdmin(searchRequest, pageable),
                SuccessCode.GET_COURSE_SUCCESS
        );
    }
    
    // Manual update rating endpoint for debugging
    @PostMapping("/{courseId}/refresh-rating")
    ApiResponse<CourseResponse> refreshCourseRating(@PathVariable String courseId) {
        log.info("Manually refreshing rating for course: {}", courseId);
        
        // Get course
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
        
        // Calculate rating from reviews
        Double avgRating = reviewRepository.calculateAverageRating(courseId);
        Long totalReviews = reviewRepository.countReviewsByCourseId(courseId);
        
        log.info("Found avgRating: {}, totalReviews: {}", avgRating, totalReviews);
        
        if (avgRating != null && avgRating > 0) {
            course.setAverageRating(BigDecimal.valueOf(avgRating).setScale(2, java.math.RoundingMode.HALF_UP));
        } else {
            course.setAverageRating(BigDecimal.ZERO);
        }
        
        course.setTotalReviews(totalReviews.intValue());
        Course savedCourse = courseRepository.save(course);
        
        log.info("Updated course - averageRating: {}, totalReviews: {}", 
                savedCourse.getAverageRating(), savedCourse.getTotalReviews());
        
        return ApiResponse.ok(courseMapper.toResponse(savedCourse), SuccessCode.UPDATED_COURSE);
    }
}
