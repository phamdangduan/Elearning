package com.example.Elearning.entity;

import com.example.Elearning.enums.ContentType;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.io.Serializable;
import java.util.Set;

@Entity
@Table(name = "lessons")
@Setter
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Lesson {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    String id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id")
    Section section;
    String title;
    @Enumerated(EnumType.STRING)
    ContentType contentType;
    String contentUrl;
    @Column(columnDefinition = "int default 0", nullable = false)
    int durationInSeconds;
    @Column(columnDefinition = "int default 0", nullable = false)
    int orderIndex;
}
