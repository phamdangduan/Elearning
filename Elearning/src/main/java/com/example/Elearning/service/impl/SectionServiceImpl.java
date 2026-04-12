package com.example.Elearning.service.impl;

import com.example.Elearning.dto.request.CreatedSectionRequest;
import com.example.Elearning.dto.request.UpdateSectionRequest;
import com.example.Elearning.dto.response.CreatedSectionResponse;
import com.example.Elearning.entity.Lesson;
import com.example.Elearning.entity.Section;
import com.example.Elearning.exception.AppException;
import com.example.Elearning.exception.ErrorCode;
import com.example.Elearning.mapper.SectionMapper;
import com.example.Elearning.repository.SectionRepository;
import com.example.Elearning.service.CourseService;
import com.example.Elearning.service.SectionService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class SectionServiceImpl implements SectionService {

    SectionMapper sectionMapper;
    SectionRepository sectionRepository;
    CourseServiceImpl courseService;

    protected Section getSectionById(String sectionId) {
        return sectionRepository.findById(sectionId)
                .orElseThrow(() -> new AppException(ErrorCode.SECTION_NOT_FOUND));
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

        return sectionMapper.toResponse(sectionRepository.save(section));
    }

    @Override
    public CreatedSectionResponse updateSection(String sectionId,String instructorId, UpdateSectionRequest request) {
        var section = this.getSectionById(sectionId);
        if (!section.getCourse().getUser().getId().equals(instructorId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        sectionMapper.updateEntity(section, request);
        return sectionMapper.toResponse(sectionRepository.save(section));
    }

    @Override
    public Void deleteSection(String sectionId,String instructorId) {
        var section = this.getSectionById(sectionId);
        if (!section.getCourse().getUser().getId().equals(instructorId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        sectionRepository.delete(section);
        return null;
    }
}
