package com.example.Elearning.service;

import com.example.Elearning.dto.request.ProfileUpdateRequest;
import com.example.Elearning.dto.response.ProfileResponse;
import com.example.Elearning.enums.UserStatus;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ProfileService {
    ProfileResponse getMyProfile(String userId);
    ProfileResponse updateProfile (ProfileUpdateRequest request, String userId);
    void deleteAll();
    List<ProfileResponse> getAll();
    List<ProfileResponse> getAllInstructors();
    String uploadAvatar(MultipartFile avatar, String userId);
    ProfileResponse updateUserStatus(String userId, UserStatus status);  // ← THÊM METHOD NÀY
    void deleteUser(String userId);  // ← THÊM METHOD XÓA USER
}
