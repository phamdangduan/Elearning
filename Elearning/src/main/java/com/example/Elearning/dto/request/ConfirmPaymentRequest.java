package com.example.Elearning.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ConfirmPaymentRequest {

    @Size(max = 1000, message = "Ghi chú tối đa 1000 ký tự")
    String instructorNote;
}
