package com.example.Elearning.repository;

import com.example.Elearning.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {

    // Lấy tất cả notifications của user, sắp xếp mới nhất trước
    List<Notification> findByUserIdOrderByCreatedAtDesc(String userId);

    // Lấy notifications chưa đọc của user
    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(String userId);

    // Đếm số notifications chưa đọc
    long countByUserIdAndIsReadFalse(String userId);
}
