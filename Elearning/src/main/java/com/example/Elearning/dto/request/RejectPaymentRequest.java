package com.example.Elearning.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RejectPaymentRequest {

    @NotBlank(message = "Lý do từ chối không được để trống")
    @Size(max = 1000, message = "Lý do tối đa 1000 ký tự")
    String instructorNote;
}
