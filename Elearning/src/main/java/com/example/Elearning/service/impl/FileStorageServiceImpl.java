package com.example.Elearning.service.impl;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.example.Elearning.dto.response.FileUploadResponse;
import com.example.Elearning.exception.AppException;
import com.example.Elearning.exception.ErrorCode;
import com.example.Elearning.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileStorageServiceImpl implements FileStorageService {

    private final Cloudinary cloudinary;
    private final Tika tika = new Tika();

    @Value("${file.upload.max-file-size:10485760}")
    private Long maxFileSize;

    @Value("${file.upload.max-video-size:524288000}")
    private Long maxVideoSize;

    @Value("${file.upload.allowed-image-types}")
    private String allowedImageTypes;

    @Value("${file.upload.allowed-video-types}")
    private String allowedVideoTypes;

    @Override
    public FileUploadResponse uploadImage(MultipartFile file, String folder) {
        validateFile(file, maxFileSize, getAllowedImageTypesList());
        return uploadToCloudinary(file, folder, "image");
    }

    @Override
    public FileUploadResponse uploadVideo(MultipartFile file, String folder) {
        validateFile(file, maxVideoSize, getAllowedVideoTypesList());
        return uploadToCloudinary(file, folder, "video");
    }

    @Override
    public void deleteFile(String publicId) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (IOException e) {
            throw new AppException(ErrorCode.FILE_DELETE_FAILED);
        }
    }

    private FileUploadResponse uploadToCloudinary(MultipartFile file, String folder, String resourceType) {
        try {
            String publicId = folder + "/" + UUID.randomUUID().toString();
            Map uploadParams = ObjectUtils.asMap(
                    "public_id", publicId,
                    "resource_type", resourceType,
                    "folder", folder
            );
            Map uploadResult = cloudinary.uploader().upload(file.getBytes(), uploadParams);

            return FileUploadResponse.builder()
                    .url((String) uploadResult.get("secure_url"))
                    .publicId((String) uploadResult.get("public_id"))
                    .fileName(file.getOriginalFilename())
                    .fileType((String) uploadResult.get("format"))
                    .fileSize(((Number) uploadResult.get("bytes")).longValue())
                    .width(uploadResult.get("width") != null ? ((Number) uploadResult.get("width")).intValue() : null)
                    .height(uploadResult.get("height") != null ? ((Number) uploadResult.get("height")).intValue() : null)
                    .build();
        } catch (IOException e) {
            throw new AppException(ErrorCode.FILE_UPLOAD_FAILED);
        }
    }

    private void validateFile(MultipartFile file, Long maxSize, List<String> allowedTypes) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.FILE_EMPTY);
        }
        if (file.getSize() > maxSize) {
            throw new AppException(ErrorCode.FILE_TOO_LARGE);
        }
        try {
            String mimeType = tika.detect(file.getBytes());
            if (!allowedTypes.contains(mimeType)) {
                throw new AppException(ErrorCode.FILE_TYPE_NOT_ALLOWED);
            }
        } catch (IOException e) {
            throw new AppException(ErrorCode.FILE_VALIDATION_FAILED);
        }
    }

    private List<String> getAllowedImageTypesList() {
        return Arrays.asList(allowedImageTypes.split(","));
    }

    private List<String> getAllowedVideoTypesList() {
        return Arrays.asList(allowedVideoTypes.split(","));
    }
}
