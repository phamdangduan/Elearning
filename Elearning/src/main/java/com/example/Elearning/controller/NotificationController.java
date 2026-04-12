package com.example.Elearning.controller;

import com.example.Elearning.dto.ApiResponse;
import com.example.Elearning.dto.response.NotificationResponse;
import com.example.Elearning.exception.SuccessCode;
import com.example.Elearning.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class NotificationController {

    NotificationService notificationService;

    // Lấy tất cả notifications
    @GetMapping("/my-notifications")
    public ApiResponse<List<NotificationResponse>> getMyNotifications(
            @RequestParam String userId
    ) {
        return ApiResponse.ok(
                notificationService.getMyNotifications(userId),
                SuccessCode.GET_NOTIFICATIONS_SUCCESS
        );
    }

    // Lấy notifications chưa đọc
    @GetMapping("/unread")
    public ApiResponse<List<NotificationResponse>> getUnreadNotifications(
            @RequestParam String userId
    ) {
        return ApiResponse.ok(
                notificationService.getUnreadNotifications(userId),
                SuccessCode.GET_NOTIFICATIONS_SUCCESS
        );
    }

    // Đếm số notifications chưa đọc
    @GetMapping("/unread-count")
    public ApiResponse<Long> countUnreadNotifications(
            @RequestParam String userId
    ) {
        return ApiResponse.ok(
                notificationService.countUnreadNotifications(userId),
                SuccessCode.GET_NOTIFICATIONS_SUCCESS
        );
    }

    // Đánh dấu đã đọc
    @PutMapping("/{notificationId}/mark-read")
    public ApiResponse<Void> markAsRead(
            @RequestParam String userId,
            @PathVariable String notificationId
    ) {
        notificationService.markAsRead(userId, notificationId);
        return ApiResponse.ok(null, SuccessCode.NOTIFICATION_MARKED_READ);
    }

    // Đánh dấu tất cả đã đọc
    @PutMapping("/mark-all-read")
    public ApiResponse<Void> markAllAsRead(
            @RequestParam String userId
    ) {
        notificationService.markAllAsRead(userId);
        return ApiResponse.ok(null, SuccessCode.NOTIFICATION_MARKED_READ);
    }
}
