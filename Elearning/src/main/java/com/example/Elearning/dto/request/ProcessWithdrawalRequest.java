package com.example.Elearning.dto.request;

import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProcessWithdrawalRequest {
    /** Ghi chú của admin. Bắt buộc khi từ chối. */
    @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
    String adminNote;

    /** Mã giao dịch ngân hàng khi chuyển tiền cho giảng viên (dùng khi duyệt). */
    @Size(max = 100, message = "Mã giao dịch tối đa 100 ký tự")
    String bankTransactionRef;
}
