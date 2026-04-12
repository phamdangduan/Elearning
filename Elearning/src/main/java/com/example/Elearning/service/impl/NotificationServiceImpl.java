package com.example.Elearning.service.impl;

import com.example.Elearning.dto.response.NotificationResponse;
import com.example.Elearning.entity.Notification;
import com.example.Elearning.enums.NotificationType;
import com.example.Elearning.exception.AppException;
import com.example.Elearning.exception.ErrorCode;
import com.example.Elearning.mapper.NotificationMapper;
import com.example.Elearning.repository.NotificationRepository;
import com.example.Elearning.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    NotificationRepository notificationRepository;
    NotificationMapper notificationMapper;

    @Override
    public void createNotification(String userId, String title, String message,
                                   NotificationType type, String referenceId) {
        // Gộp các giá trị riêng lẻ thành 1 object Notification
        var notification = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .isRead(false)
                .build();

        // Lưu object vào database
        notificationRepository.save(notification);
    }


    @Override
    public List<NotificationResponse> getMyNotifications(String userId) {
        var notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return notificationMapper.toResponseList(notifications);
    }

    @Override
    public List<NotificationResponse> getUnreadNotifications(String userId) {
        var notifications = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        return notificationMapper.toResponseList(notifications);
    }

    @Override
    public long countUnreadNotifications(String userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Override
    public void markAsRead(String userId, String notificationId) {
        var notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new AppException(ErrorCode.NOTIFICATION_NOT_FOUND));
        
        // Kiểm tra notification có thuộc về user không
        if (!notification.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.NOTIFICATION_NOT_FOUND);
        }
        
        notification.setIsRead(true);
        notificationRepository.save(notification);
    }

    @Override
    public void markAllAsRead(String userId) {
        var notifications = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        notifications.forEach(notification -> notification.setIsRead(true));
        notificationRepository.saveAll(notifications);
    }
}
