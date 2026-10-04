package com.example.Elearning.service.impl;

import com.example.Elearning.dto.request.CreatedSectionRequest;
import com.example.Elearning.dto.request.UpdateSectionRequest;
import com.example.Elearning.dto.response.CreatedSectionResponse;
import com.example.Elearning.dto.response.SectionResponse;
import com.example.Elearning.entity.Lesson;
import com.example.Elearning.entity.Section;
import com.example.Elearning.exception.AppException;
import com.example.Elearning.exception.ErrorCode;
import com.example.Elearning.mapper.SectionMapper;
import com.example.Elearning.repository.SectionRepository;
import com.example.Elearning.security.CurrentUser;
import com.example.Elearning.service.CourseService;
import com.example.Elearning.service.SectionService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class SectionServiceImpl implements SectionService {

    SectionMapper sectionMapper;
    SectionRepository sectionRepository;
    CourseServiceImpl courseService;
    CacheManager cacheManager;

    protected Section getSectionById(String sectionId) {
        return sectionRepository.findById(sectionId)
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));
    }

    // Xóa cache chi tiết khóa học (CourseServiceImpl.getCourseDetail) khi chương/bài học thay đổi
    protected void evictCourseCache(String courseId) {
        Cache cache = cacheManager.getCache("courses");
        if (cache != null) {
            cache.evict(courseId);
        }
    }


    @Override
    public CreatedSectionResponse createdSection(String courseId,String instructorId ,CreatedSectionRequest request) {
        var course = courseService.getCourseById(courseId);
        if (!course.getUser().getId().equals(instructorId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        var section = sectionMapper.toEntity(request);
        section.setCourse(course);
        // Lấy orderIndex lớn nhất hiện tại và +1
        Integer maxOrderIndex = sectionRepository.findMaxOrderIndexByCourseId(courseId);
        section.setOrderIndex(maxOrderIndex != null ? maxOrderIndex + 1 : 0);

        var saved = sectionRepository.save(section);
        evictCourseCache(courseId);
        return sectionMapper.toResponse(saved);
    }

    @Override
    public CreatedSectionResponse updateSection(String sectionId,String instructorId, UpdateSectionRequest request) {
        var section = this.getSectionById(sectionId);
        if (!section.getCourse().getUser().getId().equals(instructorId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        sectionMapper.updateEntity(section, request);
        var saved = sectionRepository.save(section);
        evictCourseCache(section.getCourse().getId());
        return sectionMapper.toResponse(saved);
    }

    @Override
    public Void deleteSection(String sectionId,String instructorId) {
        var section = this.getSectionById(sectionId);
        if (!section.getCourse().getUser().getId().equals(instructorId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        String courseId = section.getCourse().getId();
        sectionRepository.delete(section);
        evictCourseCache(courseId);
        return null;
    }

    @Override
    public List<SectionResponse> getSectionsByCourseId(String courseId) {
        // Danh sách này chứa link video của mọi bài học → chỉ chủ khóa học hoặc admin được xem
        var course = courseService.getCourseById(courseId);
        if (!course.getUser().getId().equals(CurrentUser.getUserId()) && !CurrentUser.isAdmin()) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        List<Section> sections = sectionRepository.findByCourseIdOrderByOrderIndexAsc(courseId);
        
        return sections.stream()
                .map(section -> {
                    SectionResponse response = sectionMapper.toSectionResponse(section);
                    // Manually set sectionId for each lesson
                    if (response.getLessons() != null) {
                        response.getLessons().forEach(lesson -> lesson.setSectionId(section.getId()));
                    }
                    return response;
                })
                .toList();
    }
}
