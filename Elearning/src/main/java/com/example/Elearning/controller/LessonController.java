package com.example.Elearning.controller;

import com.example.Elearning.dto.ApiResponse;
import com.example.Elearning.dto.request.CreatedLessonRequest;
import com.example.Elearning.dto.request.UpdateLessonRequest;
import com.example.Elearning.dto.response.CreatedLessonResponse;
import com.example.Elearning.dto.response.FileUploadResponse;
import com.example.Elearning.exception.AppException;
import com.example.Elearning.exception.ErrorCode;
import com.example.Elearning.exception.SuccessCode;
import com.example.Elearning.service.FileStorageService;
import com.example.Elearning.service.LessonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RequiredArgsConstructor
@RestController
@RequestMapping("/lesson")
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class LessonController {
    private final LessonService lessonService;
    private final FileStorageService fileStorageService;

    @PostMapping("/create/{sectionId}")
    ApiResponse<CreatedLessonResponse> createdLesson(@PathVariable String sectionId,
                                                     @RequestParam String instructorId,
                                                     @Valid @RequestBody CreatedLessonRequest request) {
        return ApiResponse.ok(lessonService.createdLesson(sectionId,instructorId, request), SuccessCode.CREATED_LESSON);
    }

    @DeleteMapping("/{lessonId}/delete")
    ApiResponse<Void> deleteLesson(@PathVariable String lessonId,
                                   @RequestParam String instructorId) {
        return ApiResponse.ok(lessonService.deleteLesson(lessonId,instructorId), SuccessCode.DELETED_LESSON);

    }

    @PutMapping("/update/{lessonId}")
    ApiResponse<CreatedLessonResponse> updateLesson(@PathVariable String lessonId,
                                                    @RequestParam String instructorId,
                                                    @Valid @RequestBody UpdateLessonRequest request) {
        return ApiResponse.ok(lessonService.updateLesson(lessonId,instructorId ,request), SuccessCode.UPDATED_LESSON);
    }

    @PostMapping(value = "/upload-video", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<FileUploadResponse> uploadVideo(
            @RequestPart("video") MultipartFile videoFile,
            @RequestParam String instructorId) {

        if (instructorId == null || instructorId.isEmpty()) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        FileUploadResponse response = fileStorageService.uploadVideo(videoFile, "lessons");
        return ApiResponse.ok(response, SuccessCode.FILE_UPLOADED);
    }

}
