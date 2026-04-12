package com.example.Elearning.service.impl;

import com.example.Elearning.dto.request.ProfileUpdateRequest;
import com.example.Elearning.dto.response.ProfileResponse;
import com.example.Elearning.entity.Profile;
import com.example.Elearning.entity.User;
import com.example.Elearning.exception.AppException;
import com.example.Elearning.exception.ErrorCode;
import com.example.Elearning.mapper.ProfileMapper;
import com.example.Elearning.repository.ProfileRepository;
import com.example.Elearning.service.FileStorageService;
import com.example.Elearning.service.ProfileService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class ProfileServiceImpl implements ProfileService {

    ProfileRepository profileRepository;
    ProfileMapper profileMapper;
    FileStorageService fileStorageService;

    @Override
    public ProfileResponse getMyProfile(String userId) {
        var profile = profileRepository.findByUserId(userId);
        if (profile == null) {
            throw new AppException(ErrorCode.PROFILE_NOT_FOUND);
        }
        return profileMapper.toProfileResponse(profile);
    }


    @Override
    public ProfileResponse updateProfile(ProfileUpdateRequest request, String userId) {
        var profile = profileRepository.findByUserId(userId);
        profileMapper.update(profile, request);
        return profileMapper.toProfileResponse(profileRepository.save(profile));
    }

    @Override
    public void deleteAll() {
        profileRepository.deleteAll();
    }

    @Override
    public List<ProfileResponse> getAll() {
        return profileRepository.findAll()
                .stream()
                .map(profileMapper::toProfileResponse)
                .toList();
    }

    @Override
    public List<ProfileResponse> getAllInstructors() {
        // Get all profiles where user has TEACHER role AND status is ACTIVE
        return profileRepository.findAll().stream()
                .filter(profile -> {
                    User user = profile.getUser();
                    if (user == null || user.getRoles() == null) {
                        return false;
                    }
                    // Check if user is TEACHER and ACTIVE
                    boolean isTeacher = user.getRoles().stream()
                            .anyMatch(role -> "TEACHER".equals(role.getName()));
                    boolean isActive = user.getStatus() == com.example.Elearning.enums.UserStatus.ACTIVE;
                    
                    return isTeacher && isActive;  // ← CHỈ TRẢ VỀ GIÁO VIÊN ĐANG HOẠT ĐỘNG
                })
                .map(profileMapper::toProfileResponse)
                .collect(Collectors.toList());
    }

    @Override
    public String uploadAvatar(MultipartFile avatar, String userId) {
        var profile = profileRepository.findByUserId(userId);
        if (profile == null) {
            throw new AppException(ErrorCode.PROFILE_NOT_FOUND);
        }
        
        // Upload to Cloudinary
        var uploadResult = fileStorageService.uploadImage(avatar, "avatars");
        String avatarUrl = uploadResult.getUrl();
        
        // Update profile
        profile.setAvatar(avatarUrl);
        profileRepository.save(profile);
        
        return avatarUrl;
    }

    @Override
    public ProfileResponse updateUserStatus(String userId, com.example.Elearning.enums.UserStatus status) {
        var profile = profileRepository.findByUserId(userId);
        if (profile == null) {
            throw new AppException(ErrorCode.PROFILE_NOT_FOUND);
        }
        
        User user = profile.getUser();
        if (user == null) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
        
        // Update user status
        user.setStatus(status);
        profileRepository.save(profile);
        
        return profileMapper.toProfileResponse(profile);
    }

    @Override
    public void deleteUser(String userId) {
        var profile = profileRepository.findByUserId(userId);
        if (profile == null) {
            throw new AppException(ErrorCode.PROFILE_NOT_FOUND);
        }
        
        // Xóa profile (cascade sẽ xóa user và tất cả courses, enrollments, reviews...)
        profileRepository.delete(profile);
        
        log.info("Deleted user and all related data: {}", userId);
    }

}
