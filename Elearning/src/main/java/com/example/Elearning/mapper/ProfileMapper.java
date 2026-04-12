package com.example.Elearning.mapper;

import com.example.Elearning.dto.request.ProfileUpdateRequest;
import com.example.Elearning.dto.response.ProfileResponse;
import com.example.Elearning.entity.Profile;
import com.example.Elearning.entity.Role;
import org.mapstruct.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring")
public interface ProfileMapper {

    @Mapping(source = "userId", target = "id")
    @Mapping(source = "user.userName", target = "userName")
    @Mapping(source = "user.email", target = "email")
    @Mapping(source = "user.status", target = "status", qualifiedByName = "mapStatusToString")  // ← THÊM MAPPING NÀY
    @Mapping(source = "user.roles", target = "roles", qualifiedByName = "mapRolesToStringList")
    @Mapping(source = "phone", target = "phone")
    @Mapping(source = "address", target = "address")
    @Mapping(source = "bio", target = "bio")
    @Mapping(source = "dob", target = "dob")
    @Mapping(source = "createdAt", target = "createdAt")
    @Mapping(source = "updatedAt", target = "updatedAt")
    ProfileResponse toProfileResponse(Profile profile);

    @Named("mapRolesToStringList")
    default List<String> mapRolesToStringList(Set<Role> roles) {
        if (roles == null || roles.isEmpty()) {
            return new ArrayList<>(Arrays.asList("STUDENT"));
        }
        return roles.stream()
                .map(role -> role.getName())
                .collect(Collectors.toList());
    }

    // ← THÊM METHOD NÀY ĐỂ CONVERT ENUM SANG STRING
    @Named("mapStatusToString")
    default String mapStatusToString(com.example.Elearning.enums.UserStatus status) {
        return status != null ? status.name() : "ACTIVE";
    }


    // *** SỬA LỖI 2: Bỏ qua các giá trị null khi cập nhật ***
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void update(@MappingTarget Profile profile, ProfileUpdateRequest request);
}
