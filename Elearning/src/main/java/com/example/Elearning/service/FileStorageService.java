package com.example.Elearning.service;

import com.example.Elearning.dto.response.FileUploadResponse;
import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {
    FileUploadResponse uploadImage(MultipartFile file, String folder);
    FileUploadResponse uploadVideo(MultipartFile file, String folder);
    void deleteFile(String publicId);
}
