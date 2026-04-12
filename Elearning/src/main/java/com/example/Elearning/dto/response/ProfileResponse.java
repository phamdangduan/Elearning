package com.example.Elearning.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class ProfileResponse {
    String id;
    String userName;
    String email;
    String status;  // ← THÊM FIELD NÀY
    String avatar;
    String firstName;
    String lastName;
    String fullName;
    String gender;
    LocalDate dob;
    String phone;
    String address;
    String bio;
    String locale;
    List<String> roles;
    LocalDateTime createdAt;
    LocalDateTime updatedAt;
}
