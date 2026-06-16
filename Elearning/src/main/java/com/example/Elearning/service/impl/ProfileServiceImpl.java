package com.example.Elearning.service.impl;

import com.example.Elearning.dto.request.ProfileUpdateRequest;
import com.example.Elearning.dto.response.ProfileResponse;
import com.example.Elearning.entity.Profile;
import com.example.Elearning.entity.User;
import com.example.Elearning.exception.AppException;
import com.example.Elearning.exception.ErrorCode;
import com.example.Elearning.mapper.ProfileMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.example.Elearning.repository.ProfileRepository;
import com.example.Elearning.repository.UserRepository;
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
    UserRepository userRepository;
    ProfileMapper profileMapper;
    FileStorageService fileStorageService;
    PasswordEncoder passwordEncoder;

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
        if (profile == null) {
            throw new AppException(ErrorCode.PROFILE_NOT_FOUND);
        }

        var user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (request.getEmail() != null && !request.getEmail().trim().isEmpty() 
                && !request.getEmail().trim().equalsIgnoreCase(user.getEmail())) {
            String newEmail = request.getEmail().trim();
            // Check if email already exists for another user
            var existingUser = userRepository.findByEmail(newEmail);
            if (existingUser.isPresent()) {
                throw new AppException(ErrorCode.EMAIL_EXISTED);
            }
            user.setEmail(newEmail);
            userRepository.save(user);
        }

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
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        
        // Xóa user (cascade sẽ xóa profile và tất cả courses, enrollments, reviews...)
        userRepository.delete(user);
        
        log.info("Deleted user and all related data: {}", userId);
    }

    @Override
    public void changePassword(String userId, String oldPassword, String newPassword) {
        var user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (!passwordEncoder.matches(oldPassword, user.getPasswordHash())) {
            throw new AppException(ErrorCode.PASSWORD_INVALID);
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("Successfully changed password for user: {}", userId);
    }

}
