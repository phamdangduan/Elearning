package com.example.Elearning.mapper;

import com.example.Elearning.dto.response.PaymentInfoResponse;
import com.example.Elearning.dto.response.PaymentRequestDetailResponse;
import com.example.Elearning.dto.response.PaymentRequestResponse;
import com.example.Elearning.entity.PaymentRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Mapper(componentModel = "spring", uses = {BankAccountMapper.class})
public interface PaymentRequestMapper {

    // Entity → Response DTO (list)
    @Mapping(target = "studentName", source = "student.userName")
    @Mapping(target = "courseTitle", source = "course.title")
    @Mapping(target = "courseThumbnail", source = "course.thumbnailUrl")
    @Mapping(target = "instructorName", source = "instructor.userName")
    @Mapping(target = "timeRemainingSeconds", expression = "java(calculateTimeRemaining(entity.getExpiredAt()))")
    PaymentRequestResponse toResponse(PaymentRequest entity);

    // List Entity → List Response DTO
    List<PaymentRequestResponse> toResponseList(List<PaymentRequest> entities);




    // Entity → Detail Response DTO
    @Mapping(target = "studentName", source = "student.userName")
    @Mapping(target = "studentEmail", source = "student.email")
    @Mapping(target = "courseTitle", source = "course.title")
    @Mapping(target = "courseDescription", source = "course.description")
    @Mapping(target = "courseThumbnail", source = "course.thumbnailUrl")
    @Mapping(target = "instructorName", source = "instructor.userName")
    @Mapping(target = "bankAccount", source = "instructorBankAccount")
    @Mapping(target = "timeRemainingSeconds", expression = "java(calculateTimeRemaining(entity.getExpiredAt()))")
    PaymentRequestDetailResponse toDetailResponse(PaymentRequest entity);

    // Helper method: Tính thời gian còn lại
    default Long calculateTimeRemaining(LocalDateTime expiredAt) {
        if (expiredAt == null) {
            return null;
        }
        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(expiredAt)) {
            return 0L;  // Đã hết hạn
        }
        return Duration.between(now, expiredAt).getSeconds();
    }
}
