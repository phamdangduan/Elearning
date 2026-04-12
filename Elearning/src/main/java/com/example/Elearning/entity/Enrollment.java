package com.example.Elearning.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "enrollment", uniqueConstraints = {
        @UniqueConstraint(name = "uk_enrollment_user_course", columnNames = {"user_id", "course_id"})
})
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class Enrollment implements Serializable {

    @Id
    @Column(name = "id", length = 36)
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "course_id")
    private Course course;

    @Column(name = "payment_request_id", length = 36)
    String paymentRequestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_request_id", insertable = false, updatable = false)
    PaymentRequest paymentRequest;


    @Column(name = "enrollment_date")
    private LocalDateTime enrollmentDate;

    @PrePersist
    protected void onCreate() {
        if (enrollmentDate == null) {
            enrollmentDate = LocalDateTime.now();
        }
    }
}
