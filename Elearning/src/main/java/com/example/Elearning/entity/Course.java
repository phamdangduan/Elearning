package com.example.Elearning.entity;

import com.example.Elearning.enums.CourseStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "courses")
@Setter
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Course implements Serializable {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;
    
    @Column(name = "title")
    String title;
    
    @Column(name = "description", columnDefinition = "TEXT")
    String description;
    
    @Column(name = "thumbnail_url", length = 500)
    String thumbnailUrl;
    
    @Column(name = "price", precision = 19, scale = 2)
    BigDecimal price;

    @Column(name = "average_rating", precision = 3, scale = 2)
    BigDecimal averageRating;

    @Column(name = "total_reviews")
    Integer totalReviews;

    @Column(name = "total_enrollments")
    Integer totalEnrollments;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    CourseStatus status;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    User user;

    @ManyToMany(fetch = FetchType.LAZY, cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
            name = "course_categories",
            joinColumns = @JoinColumn(name = "course_id"),
            inverseJoinColumns = @JoinColumn(name = "category_id")
    )
    List<Category> categories;


    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("orderIndex ASC")
    List<Section> sections;
    
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    Set<Enrollment> enrollments;
    
    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL)
    Set<Review> reviews;
    
    @Column(name = "created_at")
    LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
        if (status == null) {
            status = CourseStatus.DRAFT;
        }

        if (totalReviews == null) {
            totalReviews = 0;
        }
        if (totalEnrollments == null) {
            totalEnrollments = 0;
        }
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
