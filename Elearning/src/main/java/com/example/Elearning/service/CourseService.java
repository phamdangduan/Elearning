package com.example.Elearning.service;

import com.example.Elearning.dto.PageResponse;
import com.example.Elearning.dto.request.CreatedCourseRequest;
import com.example.Elearning.dto.request.UpdateCourseRequest;
import com.example.Elearning.dto.request.UploadThumbnailRequest;
import com.example.Elearning.dto.response.CourseDetailResponse;
import com.example.Elearning.dto.response.CourseResponse;
import com.example.Elearning.dto.response.CreatedCourseResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CourseService {
    PageResponse<CourseResponse> getCourseWithStatusByUserId(String userId, Pageable pageable);
    PageResponse<CourseResponse> getAllCourseStatusPublish(Pageable pageable);
    PageResponse<CourseResponse> getCourseMy(String userId,Pageable pageable);
    CourseDetailResponse getCourseDetail(String courseId);
    CourseDetailResponse getCourseDetailForStudent(String courseId, String studentId);
    CreatedCourseResponse createCourse(String userId, CreatedCourseRequest createdCourseRequest);
    CourseResponse uploadThumbnail(String courseId,String instructorId, UploadThumbnailRequest request);
    CourseResponse updateCourse(String courseId, String instructorId, UpdateCourseRequest request);
    CourseResponse publishCourse(String courseId,String instructorId);
    Void deleteCourse (String courseId,String instructorId);


    // Tìm kiếm động Generic cho người dùng (chỉ lấy PUBLISHED và ACTIVE instructor)
    PageResponse<CourseResponse> searchAndFilterCourses(
            String[] filter,
            Pageable pageable
    );

    // Tìm kiếm động Generic cho admin
    PageResponse<CourseResponse> searchAndFilterCoursesAdmin(
            String[] filter,
            Pageable pageable
    );
}
