package com.example.Elearning.controller;

import com.example.Elearning.dto.ApiResponse;
import com.example.Elearning.dto.request.CreatedSectionRequest;
import com.example.Elearning.dto.request.UpdateSectionRequest;
import com.example.Elearning.dto.response.CreatedSectionResponse;
import com.example.Elearning.exception.SuccessCode;
import com.example.Elearning.service.SectionService;
import com.example.Elearning.service.impl.SectionServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

@RequiredArgsConstructor
@Slf4j
@RestController
@RequestMapping("/section")
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class SectionController {
    private final SectionService sectionService;

    @PostMapping("/created/{courseId}")
    ApiResponse<CreatedSectionResponse> createSection(@PathVariable String courseId,
                                                      @RequestParam String instructorId,
                                                      @Valid @RequestBody CreatedSectionRequest request) {
        return ApiResponse.ok(sectionService.createdSection(courseId,instructorId, request), SuccessCode.CREATED_SECTION);
    }

    @PutMapping("/update/{sectionId}")
    ApiResponse<CreatedSectionResponse> updateSection(@PathVariable String sectionId,
                                                      @RequestParam String instructorId,
                                                      @Valid @RequestBody UpdateSectionRequest request) {
        return ApiResponse.ok(sectionService.updateSection(sectionId,instructorId, request), SuccessCode.UPDATED_SECTION);
    }

    @DeleteMapping("/{sectionId}/delete")
    ApiResponse<Void> deleteSection(@PathVariable String sectionId,
                                    @RequestParam String instructorId
                                    ) {
        return ApiResponse.ok(sectionService.deleteSection(sectionId,instructorId), SuccessCode.DELETED_SECTION);
    }
}
