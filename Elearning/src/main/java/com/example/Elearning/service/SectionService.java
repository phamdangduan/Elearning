package com.example.Elearning.service;

import com.example.Elearning.dto.request.CreatedSectionRequest;
import com.example.Elearning.dto.request.UpdateSectionRequest;
import com.example.Elearning.dto.response.CreatedSectionResponse;

public interface SectionService {
    CreatedSectionResponse createdSection(String courseId, String instructorId,CreatedSectionRequest request);
    CreatedSectionResponse updateSection(String sectionId,String instructorId, UpdateSectionRequest request);
    Void deleteSection( String sectionId,String instructorId);
}
