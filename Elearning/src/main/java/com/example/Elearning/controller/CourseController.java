package com.example.Elearning.controller;

import com.example.Elearning.dto.ApiResponse;
import com.example.Elearning.dto.PageResponse;
import com.example.Elearning.dto.request.CreatedCourseRequest;
import com.example.Elearning.dto.request.UpdateCourseRequest;
import com.example.Elearning.dto.request.UploadThumbnailRequest;
import com.example.Elearning.dto.response.CourseDetailResponse;
import com.example.Elearning.dto.response.CourseResponse;
import com.example.Elearning.dto.response.CreatedCourseResponse;
import com.example.Elearning.dto.response.FileUploadResponse;
import com.example.Elearning.exception.AppException;
import com.example.Elearning.exception.ErrorCode;
import com.example.Elearning.exception.SuccessCode;
import com.example.Elearning.security.CurrentUser;
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

@RestController
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/course")
public class CourseController {
    CourseService courseService;
    FileStorageService fileStorageService;

    @GetMapping("/get")
    ApiResponse<PageResponse<CourseResponse>> getCourseWithStatusByUser(@RequestParam String userId, Pageable pageable){
        return ApiResponse.ok(courseService.getCourseWithStatusByUserId(userId, pageable), SuccessCode.GET_MY_COURSE_SUCCESS);
    }

    @GetMapping
    ApiResponse<PageResponse<CourseResponse>> getAllCoursesByPublish(Pageable pageable){
        return ApiResponse.ok( courseService.getAllCourseStatusPublish(pageable), SuccessCode.GET_COURSE_PUBLISH_SUCCESS);
    }

    @GetMapping("/teacher")
    ApiResponse<PageResponse<CourseResponse>> getCourseMy(@RequestParam(required = false) String userId,Pageable pageable){
        userId = CurrentUser.resolve(userId);
        return ApiResponse.ok(courseService.getCourseMy(userId,pageable), SuccessCode.GET_MY_COURSE_SUCCESS);
    }

    @GetMapping("/{courseId}")
    ApiResponse<CourseDetailResponse> getCourseDetail(@PathVariable String courseId) {
        return ApiResponse.ok(courseService.getCourseDetail(courseId), SuccessCode.GET_COURSE_DETAIL_SUCCESS);
    }

    @GetMapping("/{courseId}/student")
    ApiResponse<CourseDetailResponse> getCourseDetailForStudent(
            @PathVariable String courseId,
            @RequestParam(required = false) String studentId) {
        studentId = CurrentUser.resolve(studentId);
        return ApiResponse.ok(courseService.getCourseDetailForStudent(courseId, studentId), SuccessCode.GET_COURSE_DETAIL_SUCCESS);
    }

    @PostMapping("/create")
    public ApiResponse<CreatedCourseResponse> createCourse(@RequestParam(required = false) String userId, @Valid @RequestBody CreatedCourseRequest request) {
        userId = CurrentUser.resolve(userId);
        return ApiResponse.ok(courseService.createCourse(userId, request), SuccessCode.CREATED_COURSE);
    }

    @PatchMapping("/{courseId}/thumbnail")
    ApiResponse<CourseResponse> uploadThumbnail(@PathVariable String courseId,
                                                @RequestParam(required = false) String instructorId,
                                                @Valid @RequestBody UploadThumbnailRequest request) {
        instructorId = CurrentUser.resolve(instructorId);
        return ApiResponse.ok(courseService.uploadThumbnail(courseId, instructorId ,request), SuccessCode.UPDATED_COURSE);
    }

    @PutMapping("/{courseId}/update")
    ApiResponse<CourseResponse> updateCourse(@PathVariable String courseId,
                                             @RequestParam(required = false) String instructorId,
                                             @Valid @RequestBody UpdateCourseRequest request) {
        instructorId = CurrentUser.resolve(instructorId);
        return ApiResponse.ok(courseService.updateCourse(courseId,instructorId, request), SuccessCode.UPDATED_COURSE);
    }

    @PatchMapping("/{courseId}/publish")
    ApiResponse<CourseResponse> publishCourse(@PathVariable String courseId,
                                              @RequestParam(required = false) String instructorId) {
        instructorId = CurrentUser.resolve(instructorId);
        return ApiResponse.ok(courseService.publishCourse(courseId,instructorId), SuccessCode.UPDATED_COURSE);
    }

    @DeleteMapping("/{courseId}")
    ApiResponse<Void> deleteCourse(@PathVariable String courseId,
                                   @RequestParam(required = false) String instructorId) {
        instructorId = CurrentUser.resolve(instructorId);
        return ApiResponse.ok(courseService.deleteCourse(courseId,instructorId), SuccessCode.DELETED_COURSE);
    }

    // Thêm method này (tương tự lesson)
    @PostMapping(value = "/upload-thumbnail", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<FileUploadResponse> uploadThumbnail(
            @RequestPart("image") MultipartFile imageFile,
            @RequestParam(required = false) String instructorId) {
        instructorId = CurrentUser.resolve(instructorId);

        if (instructorId == null || instructorId.isEmpty()) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        FileUploadResponse response = fileStorageService.uploadImage(imageFile, "courses");
        return ApiResponse.ok(response, SuccessCode.FILE_UPLOADED);
    }


    // THÊM ENDPOINT MỚI
    @GetMapping("/search")
    ApiResponse<PageResponse<CourseResponse>> searchAndFilterCourses(
            @RequestParam(required = false) String[] filter,
            Pageable pageable) {

        return ApiResponse.ok(
                courseService.searchAndFilterCourses(filter, pageable),
                SuccessCode.GET_COURSE_SUCCESS
        );
    }

    // Admin endpoint - no status filter
    @GetMapping("/search/admin")
    ApiResponse<PageResponse<CourseResponse>> searchAndFilterCoursesAdmin(
            @RequestParam(required = false) String[] filter,
            Pageable pageable) {

        return ApiResponse.ok(
                courseService.searchAndFilterCoursesAdmin(filter, pageable),
                SuccessCode.GET_COURSE_SUCCESS
        );
    }
}
