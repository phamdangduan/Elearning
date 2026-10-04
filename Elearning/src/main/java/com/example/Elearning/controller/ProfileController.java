package com.example.Elearning.controller;

import com.example.Elearning.dto.ApiResponse;
import com.example.Elearning.dto.request.ProfileUpdateRequest;
import com.example.Elearning.dto.request.ChangePasswordRequest;
import com.example.Elearning.dto.response.ProfileResponse;
import com.example.Elearning.exception.SuccessCode;
import com.example.Elearning.security.CurrentUser;
import com.example.Elearning.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/profile")
public class ProfileController {
    ProfileService profileService;

    @GetMapping("/me")
    ApiResponse<ProfileResponse> getMyProfile(@RequestParam(required = false) String userId) {
        userId = CurrentUser.resolve(userId);
        return ApiResponse.ok(profileService.getMyProfile(userId), SuccessCode.GET_PROFILE_SUCCESS);
    }

    @PutMapping("/update")
    ApiResponse<ProfileResponse> updateProfile(@RequestBody ProfileUpdateRequest request,@RequestParam(required = false) String userId) {
        userId = CurrentUser.resolve(userId);
        return ApiResponse.ok(profileService.updateProfile(request,userId), SuccessCode.PROFILE_UPDATED);
    }

    @GetMapping("/getAll")
    public ApiResponse<List<ProfileResponse>> getAll() {
        return ApiResponse.ok(profileService.getAll(), SuccessCode.GET_PROFILE_SUCCESS);
    }

    @GetMapping("/instructors")
    public ApiResponse<List<ProfileResponse>> getAllInstructors() {
        return ApiResponse.ok(profileService.getAllInstructors(), SuccessCode.GET_PROFILE_SUCCESS);
    }

    @PostMapping("/upload-avatar")
    public ApiResponse<String> uploadAvatar(
            @RequestParam("avatar") MultipartFile avatar,
            @RequestParam(required = false) String userId) {
        userId = CurrentUser.resolve(userId);
        return ApiResponse.ok(profileService.uploadAvatar(avatar, userId), SuccessCode.PROFILE_UPDATED);
    }

    @PatchMapping("/{userId}/status")
    public ApiResponse<ProfileResponse> updateUserStatus(
            @PathVariable String userId,
            @RequestParam String status) {
        com.example.Elearning.enums.UserStatus userStatus = 
            com.example.Elearning.enums.UserStatus.valueOf(status.toUpperCase());
        return ApiResponse.ok(
            profileService.updateUserStatus(userId, userStatus), 
            SuccessCode.PROFILE_UPDATED
        );
    }

    @GetMapping("/{userId}")
    public ApiResponse<ProfileResponse> getUserProfile(@PathVariable String userId) {
        return ApiResponse.ok(profileService.getMyProfile(userId), SuccessCode.GET_PROFILE_SUCCESS);
    }

    @DeleteMapping("/{userId}")
    public ApiResponse<Void> deleteUser(@PathVariable String userId) {
        profileService.deleteUser(userId);
        return ApiResponse.ok(null, SuccessCode.DELETE_ALL_SUCCESS);
    }

    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(
            @RequestParam(required = false) String userId,
            @Valid @RequestBody ChangePasswordRequest request) {
        userId = CurrentUser.resolve(userId);
        profileService.changePassword(userId, request.getOldPassword(), request.getNewPassword());
        return ApiResponse.ok(null, SuccessCode.PROFILE_UPDATED);
    }

}
