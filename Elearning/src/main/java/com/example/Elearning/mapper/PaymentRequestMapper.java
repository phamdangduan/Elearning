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
    @Mapping(target = "studentName", source = "entity", qualifiedByName = "mapStudentName")
    @Mapping(target = "courseTitle", source = "course.title")
    @Mapping(target = "courseThumbnail", source = "course.thumbnailUrl")
    @Mapping(target = "instructorName", source = "entity", qualifiedByName = "mapInstructorName")
    @Mapping(target = "timeRemainingSeconds", expression = "java(calculateTimeRemaining(entity.getExpiredAt()))")
    PaymentRequestResponse toResponse(PaymentRequest entity);

    // List Entity → List Response DTO
    List<PaymentRequestResponse> toResponseList(List<PaymentRequest> entities);




    // Entity → Detail Response DTO
    @Mapping(target = "studentName", source = "entity", qualifiedByName = "mapStudentName")
    @Mapping(target = "studentEmail", source = "student.email")
    @Mapping(target = "courseTitle", source = "course.title")
    @Mapping(target = "courseDescription", source = "course.description")
    @Mapping(target = "courseThumbnail", source = "course.thumbnailUrl")
    @Mapping(target = "instructorName", source = "entity", qualifiedByName = "mapInstructorName")
    @Mapping(target = "bankAccount", source = "instructorBankAccount")
    @Mapping(target = "timeRemainingSeconds", expression = "java(calculateTimeRemaining(entity.getExpiredAt()))")
    PaymentRequestDetailResponse toDetailResponse(PaymentRequest entity);

    @org.mapstruct.Named("mapStudentName")
    default String mapStudentName(PaymentRequest entity) {
        if (entity.getStudent() == null) {
            return null;
        }
        if (entity.getStudent().getProfile() != null && 
            entity.getStudent().getProfile().getFullName() != null && 
            !entity.getStudent().getProfile().getFullName().trim().isEmpty()) {
            return entity.getStudent().getProfile().getFullName();
        }
        return entity.getStudent().getUserName();
    }

    @org.mapstruct.Named("mapInstructorName")
    default String mapInstructorName(PaymentRequest entity) {
        if (entity.getInstructor() == null) {
            return null;
        }
        if (entity.getInstructor().getProfile() != null && 
            entity.getInstructor().getProfile().getFullName() != null && 
            !entity.getInstructor().getProfile().getFullName().trim().isEmpty()) {
            return entity.getInstructor().getProfile().getFullName();
        }
        return entity.getInstructor().getUserName();
    }

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
