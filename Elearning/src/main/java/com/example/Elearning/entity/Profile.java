package com.example.Elearning.entity;
import com.example.Elearning.enums.CourseStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
@Entity
@Table(name = "profiles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Profile {

    @Id
    @Column(name = "profile_id", length = 36)
    String profileId;

    @Column(name = "user_id", length = 36, unique = true, nullable = false)
    String userId;

    @Column(name = "first_name", length = 100)
    String firstName;

    @Column(name = "last_name", length = 100)
    String lastName;

    @Column(name = "full_name", length = 200)
    String fullName;

    @Column(name = "avatar", length = 500)
    String avatar;

    @Column(name = "gender", length = 20)
    String gender;

    @Column(name = "dob")
    LocalDate dob;

    @Column(name = "phone", length = 20)
    String phone;

    @Column(name = "address", length = 500)
    String address;

    @Column(name = "city", length = 100)
    String city;

    @Column(name = "country", length = 100)
    String country;

    @Column(name = "locale", length = 10)
    String locale;

    @Column(name = "bio", columnDefinition = "TEXT")
    String bio;

    @Column(name = "created_at", updatable = false)
    LocalDateTime createdAt;

    @Column(name = "updated_at")
    LocalDateTime updatedAt;

    // Relationship với User (Optional - nếu cần)
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id", insertable = false, updatable = false)
    User user;



    // Lifecycle callbacks để tự động set timestamps
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
