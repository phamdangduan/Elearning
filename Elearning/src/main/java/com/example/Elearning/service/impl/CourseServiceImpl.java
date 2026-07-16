package com.example.Elearning.service.impl;

import com.example.Elearning.dto.PageResponse;
import com.example.Elearning.dto.request.CreatedCourseRequest;
import com.example.Elearning.dto.request.UpdateCourseRequest;
import com.example.Elearning.dto.request.UploadThumbnailRequest;
import com.example.Elearning.dto.response.*;
import com.example.Elearning.entity.Category;
import com.example.Elearning.entity.Course;
import com.example.Elearning.repository.CategoryRepository;
import com.example.Elearning.enums.CourseStatus;
import com.example.Elearning.exception.AppException;
import com.example.Elearning.exception.ErrorCode;
import com.example.Elearning.mapper.CourseMapper;
import com.example.Elearning.repository.CourseRepository;
import com.example.Elearning.repository.EnrollmentRepository;
import com.example.Elearning.repository.ReviewRepository;
import com.example.Elearning.repository.UserRepository;
import com.example.Elearning.service.CourseService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import com.example.Elearning.specification.CourseSpecifications;
import com.example.Elearning.specification.helper.SpecificationHelper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CourseServiceImpl implements CourseService {

    CourseRepository courseRepository;
    EnrollmentRepository enrollmentRepository;
    ReviewRepository reviewRepository;
    CourseMapper courseMapper;
    com.example.Elearning.repository.UserRepository userRepository;
    CategoryRepository categoryRepository;

    @Override
    public PageResponse<CourseResponse> getCourseWithStatusByUserId(String userId, Pageable pageable) {
        Page<Course> coursePage = courseRepository.findCourseByUserIdAndStatus(userId, CourseStatus.PUBLISHED, pageable);
        
        // ← FILTER ĐÃ ĐƯỢC XỬ LÝ Ở DATABASE LEVEL
        List<CourseResponse> courseResponses = coursePage.getContent()
                .stream()
                .map(courseMapper::toResponse)
                .collect(Collectors.toList());
                
        return PageResponse.<CourseResponse>builder()
                .content(courseResponses)
                .pageNo(coursePage.getNumber())
                .pageSize(coursePage.getSize())
                .totalElement(coursePage.getTotalElements())
                .totalPages(coursePage.getTotalPages())
                .build();
    }

    @Override
    public PageResponse<CourseResponse> getAllCourseStatusPublish(Pageable pageable) {
        Page<Course> coursePage= courseRepository.findCourseByStatus(CourseStatus.PUBLISHED, pageable);
        
        // ← FILTER ĐÃ ĐƯỢC XỬ LÝ Ở DATABASE LEVEL
        List<CourseResponse> courseResponses = coursePage.getContent()
                .stream()
                .map(courseMapper::toResponse)
                .collect(Collectors.toList());
                
        return PageResponse.<CourseResponse>builder()
                .content(courseResponses)
                .pageNo(coursePage.getNumber())
                .pageSize(coursePage.getSize())
                .totalElement(coursePage.getTotalElements())
                .totalPages(coursePage.getTotalPages())
                .build();
    }

    @Override
    public PageResponse<CourseResponse> getCourseMy(String userId, Pageable pageable) {
        Page<Course> coursePage = courseRepository.getCourseByUser_Id(userId, pageable);
        List<CourseResponse> courseResponses = coursePage.getContent()
                .stream()
                .map(courseMapper::toResponse)
                .collect(Collectors.toList());
        return PageResponse.<CourseResponse>builder()
                .content(courseResponses)
                .pageNo(coursePage.getNumber())
                .pageSize(coursePage.getSize())
                .totalElement(coursePage.getTotalElements())
                .totalPages(coursePage.getTotalPages())
                .build();
    }

    @Override
    public CourseDetailResponse getCourseDetail(String courseId) {
        Course course = courseRepository.findCourseDetailsById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        // Kiểm tra nếu instructor bị khóa và course không published
        // thì không cho xem (trừ khi là học sinh đã đăng ký - dùng getCourseDetailForStudent)
        if (course.getUser().getStatus() != com.example.Elearning.enums.UserStatus.ACTIVE 
            && course.getStatus() != com.example.Elearning.enums.CourseStatus.PUBLISHED) {
            throw new AppException(ErrorCode.COURSE_NOT_FOUND);
        }

        CourseDetailResponse response = courseMapper.toCourseDetailResponse(course);

        Integer totalEnrollments = enrollmentRepository.countByCourse_Id(courseId);
        response.setTotalEnrollments(totalEnrollments);
        response.setTotalStudents(totalEnrollments);  // Set alias for frontend

        Integer totalReviews = reviewRepository.countByCourseId(courseId);
        Double averageRating = reviewRepository.calculateAverageRating(courseId);


        response.setTotalReviews(totalReviews);
        response.setAverageRating(averageRating != null ? BigDecimal.valueOf(averageRating) : null);

        // Tính tổng số lessons và tổng thời lượng
        int totalLessons = 0;
        int totalDurationSeconds = 0;
        
        if (response.getSections() != null) {
            for (SectionResponse section : response.getSections()) {
                if (section.getLessons() != null) {
                    totalLessons += section.getLessons().size();
                    for (LessonResponse lesson : section.getLessons()) {
                        Integer duration = lesson.getDurationInSeconds();
                        if (duration != null) {
                            totalDurationSeconds += duration;
                        }
                    }
                }
            }
        }
        
        response.setTotalLessons(totalLessons);
        response.setTotalDurationSeconds(totalDurationSeconds);

        return response;
    }

    @Override
    public CourseDetailResponse getCourseDetailForStudent(String courseId, String studentId) {
        Course course = courseRepository.findCourseDetailsById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        // Kiểm tra xem học sinh đã đăng ký chưa
        boolean isEnrolled = enrollmentRepository.existsByUserIdAndCourseId(studentId, courseId);
        
        // Nếu chưa đăng ký và instructor bị khóa, không cho xem
        if (!isEnrolled && course.getUser().getStatus() != com.example.Elearning.enums.UserStatus.ACTIVE) {
            throw new AppException(ErrorCode.COURSE_NOT_FOUND);
        }

        // Nếu đã đăng ký, cho phép xem dù instructor bị khóa
        CourseDetailResponse response = courseMapper.toCourseDetailResponse(course);

        Integer totalEnrollments = enrollmentRepository.countByCourse_Id(courseId);
        response.setTotalEnrollments(totalEnrollments);
        response.setTotalStudents(totalEnrollments);  // Set alias for frontend

        Integer totalReviews = reviewRepository.countByCourseId(courseId);
        Double averageRating = reviewRepository.calculateAverageRating(courseId);

        response.setTotalReviews(totalReviews);
        response.setAverageRating(averageRating != null ? BigDecimal.valueOf(averageRating) : null);

        // Tính tổng số lessons và tổng thời lượng
        int totalLessons = 0;
        int totalDurationSeconds = 0;
        
        if (response.getSections() != null) {
            for (SectionResponse section : response.getSections()) {
                if (section.getLessons() != null) {
                    totalLessons += section.getLessons().size();
                    for (LessonResponse lesson : section.getLessons()) {
                        Integer duration = lesson.getDurationInSeconds();
                        if (duration != null) {
                            totalDurationSeconds += duration;
                        }
                    }
                }
            }
        }
        
        response.setTotalLessons(totalLessons);
        response.setTotalDurationSeconds(totalDurationSeconds);

        return response;
    }



    @Override
    public CreatedCourseResponse createCourse(String userId, CreatedCourseRequest createdCourseRequest) {
        log.info("Creating course for userId: {}", userId);
        log.info("Request: title={}, description={}, price={}, categoryIds={}, thumbnailUrl={}", 
                createdCourseRequest.getTitle(), 
                createdCourseRequest.getDescription(), 
                createdCourseRequest.getPrice(), 
                createdCourseRequest.getCategoryIds(),
                createdCourseRequest.getThumbnailUrl());
        
        var course = courseMapper.toEntity(createdCourseRequest);
        if (createdCourseRequest.getCategoryIds() != null && !createdCourseRequest.getCategoryIds().isEmpty()) {
            List<Category> categories = categoryRepository.findAllById(createdCourseRequest.getCategoryIds());
            course.setCategories(categories);
        }
        
        // Fetch user from database to ensure it exists and is managed by Hibernate
        com.example.Elearning.entity.User user = userRepository.findById(userId)
                .orElseThrow(() -> {
                    log.error("User not found: {}", userId);
                    return new AppException(ErrorCode.USER_NOT_FOUND);
                });
        
        log.info("Found user: {} ({})", user.getUserName(), user.getId());
        course.setUser(user);
        
        // Generate UUID for course
        course.setId(java.util.UUID.randomUUID().toString());
        
        // Set default status if not set
        if (course.getStatus() == null) {
            course.setStatus(CourseStatus.DRAFT);
        }
        
        // Set timestamps
        course.setCreatedAt(LocalDateTime.now());
        course.setUpdatedAt(LocalDateTime.now());
        
        courseRepository.save(course);
        log.info("Created course {} for user {} with thumbnail: {}", 
                course.getId(), userId, course.getThumbnailUrl());
        
        return courseMapper.toResponseCreated(course);
    }

    public Course getCourseById(String id) {
        return courseRepository.findById(id)
                .orElseThrow(() ->
                        new AppException(ErrorCode.COURSE_NOT_FOUND));
    }


    @Override
    public CourseResponse uploadThumbnail(String courseId,String instructorId, UploadThumbnailRequest request) {
        var course = this.getCourseById(courseId);
        if (!course.getUser().getId().equals(instructorId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        course.setThumbnailUrl(request.getThumbnailUrl());
        course.setUpdatedAt(LocalDateTime.now());
        return courseMapper.toResponse(courseRepository.save(course));
    }

    @Override
    public CourseResponse updateCourse(String courseId,String instructorId, UpdateCourseRequest request) {
        var course = this.getCourseById(courseId);
        if (!course.getUser().getId().equals(instructorId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        courseMapper.updateEntity(course, request);
        if (request.getCategoryIds() != null) {
            List<Category> categories = categoryRepository.findAllById(request.getCategoryIds());
            course.setCategories(categories);
        }
        course.setUpdatedAt(LocalDateTime.now());
        return courseMapper.toResponse(courseRepository.save(course));
    }

    @Override
    public CourseResponse publishCourse(String courseId,String instructorId) {
        var course = this.getCourseById(courseId);
        if (!course.getUser().getId().equals(instructorId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        course.setStatus(CourseStatus.PUBLISHED);
        course.setUpdatedAt(LocalDateTime.now());
        return courseMapper.toResponse(courseRepository.save(course));
    }

    @Override
    public Void deleteCourse(String courseId,String instructorId) {
        var course = this.getCourseById(courseId);
        if (!course.getUser().getId().equals(instructorId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        courseRepository.delete(course);
        return null;
    }


    @Override
    public PageResponse<CourseResponse> searchAndFilterCourses(
            String[] filter,
            Pageable pageable) {

        // 1. Dựng Generic Specification từ mảng filter gửi lên
        Specification<Course> genericSpec = SpecificationHelper.buildSpecification(filter);

        // 2. Dựng bộ lọc trạng thái bắt buộc cho học viên (chỉ lấy PUBLISHED và giáo viên ACTIVE)
        Specification<Course> statusSpec = CourseSpecifications.hasStatus(CourseStatus.PUBLISHED)
                .and(CourseSpecifications.hasActiveInstructor());

        // 3. Kết hợp các bộ lọc
        Specification<Course> finalSpec = Specification.where(genericSpec).and(statusSpec);

        // 4. Gọi repository truy vấn dữ liệu phân trang tối ưu
        Page<Course> coursePage = courseRepository.findAll(finalSpec, pageable);

        // Convert kết quả sang DTO Response
        List<CourseResponse> courseResponses = coursePage.getContent()
                .stream()
                .map(courseMapper::toResponse)
                .collect(Collectors.toList());

        return PageResponse.<CourseResponse>builder()
                .content(courseResponses)
                .pageNo(coursePage.getNumber())
                .pageSize(coursePage.getSize())
                .totalElement(coursePage.getTotalElements())
                .totalPages(coursePage.getTotalPages())
                .last(coursePage.isLast())
                .build();
    }

    @Override
    public PageResponse<CourseResponse> searchAndFilterCoursesAdmin(
            String[] filter,
            Pageable pageable) {

        // 1. Dựng Generic Specification từ mảng filter
        Specification<Course> genericSpec = SpecificationHelper.buildSpecification(filter);

        // 2. Gọi repository truy vấn dữ liệu phân trang (không lọc trạng thái cho admin)
        Page<Course> coursePage = courseRepository.findAll(genericSpec, pageable);

        // Convert kết quả sang DTO Response
        List<CourseResponse> courseResponses = coursePage.getContent()
                .stream()
                .map(courseMapper::toResponse)
                .collect(Collectors.toList());

        return PageResponse.<CourseResponse>builder()
                .content(courseResponses)
                .pageNo(coursePage.getNumber())
                .pageSize(coursePage.getSize())
                .totalElement(coursePage.getTotalElements())
                .totalPages(coursePage.getTotalPages())
                .last(coursePage.isLast())
                .build();
    }

}
