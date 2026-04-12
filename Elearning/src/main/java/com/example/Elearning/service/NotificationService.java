package com.example.Elearning.service;

import com.example.Elearning.dto.response.NotificationResponse;
import com.example.Elearning.enums.NotificationType;

import java.util.List;

public interface NotificationService {

    // Tạo notification mới
    void createNotification(String userId, String title, String message,
                            NotificationType type, String referenceId);

    // Lấy tất cả notifications của user
    List<NotificationResponse> getMyNotifications(String userId);

    // Lấy notifications chưa đọc
    List<NotificationResponse> getUnreadNotifications(String userId);

    // Đếm số notifications chưa đọc
    long countUnreadNotifications(String userId);

    // Đánh dấu đã đọc
    void markAsRead(String userId, String notificationId);

    // Đánh dấu tất cả đã đọc
    void markAllAsRead(String userId);
}
