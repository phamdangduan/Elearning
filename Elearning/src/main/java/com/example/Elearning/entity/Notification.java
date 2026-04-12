package com.example.Elearning.entity;

import com.example.Elearning.enums.NotificationType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", length = 36)
    String id;

    @Column(name = "user_id", length = 36, nullable = false)
    String userId;

    @Column(name = "title", nullable = false)
    String title;

    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    String message;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 50, nullable = false)
    NotificationType type;

    @Column(name = "reference_id", length = 36)
    String referenceId;

    @Column(name = "is_read", nullable = false)
    Boolean isRead = false;

    @Column(name = "created_at", nullable = false)
    LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (isRead == null) {
            isRead = false;
        }
    }
}
