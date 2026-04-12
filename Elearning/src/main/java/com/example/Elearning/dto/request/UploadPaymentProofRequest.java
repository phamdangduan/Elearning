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
public class UploadPaymentProofRequest {

    @Size(max = 1000, message = "Ghi chú tối đa 1000 ký tự")
    String studentNote;

    @NotBlank(message = "Link ảnh bill không được để trống")
    @Size(max = 500, message = "Link ảnh tối đa 500 ký tự")
    String paymentProofUrl;

    @Size(max = 500, message = "Nội dung chuyển khoản tối đa 500 ký tự")
    String transferNote;
}
