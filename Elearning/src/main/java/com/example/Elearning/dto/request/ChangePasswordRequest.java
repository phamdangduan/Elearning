package com.example.Elearning.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ChangePasswordRequest {
    @NotBlank(message = "Mật khẩu cũ không được để trống")
    String oldPassword;
    
    @NotBlank(message = "Mật khẩu mới không được để trống")
    String newPassword;
}
