package com.example.Elearning.mapper;

import com.example.Elearning.dto.request.CreateBankAccountRequest;
import com.example.Elearning.dto.response.BankAccountResponse;
import com.example.Elearning.entity.InstructorBankAccount;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface BankAccountMapper {

    // Entity → Response DTO
    BankAccountResponse toResponse(InstructorBankAccount entity);

    // List Entity → List Response DTO
    List<BankAccountResponse> toResponseList(List<InstructorBankAccount> entities);

    // Request DTO → Entity (khi tạo mới)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    InstructorBankAccount toEntity(CreateBankAccountRequest request);

    // Update entity từ request (khi update)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "userId", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(CreateBankAccountRequest request, @MappingTarget InstructorBankAccount entity);
}
