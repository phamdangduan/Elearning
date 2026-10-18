package com.example.Elearning.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateWithdrawalRequest {
    @NotNull(message = "Số tiền rút không được để trống")
    @Positive(message = "Số tiền rút phải lớn hơn 0")
    BigDecimal amount;

    /** Bỏ trống → dùng tài khoản ngân hàng chính. */
    String bankAccountId;

    @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
    String note;
}
