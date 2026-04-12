package com.example.Elearning.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadResponse {
    private String url;
    private String publicId;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private Integer width;
    private Integer height;
}
