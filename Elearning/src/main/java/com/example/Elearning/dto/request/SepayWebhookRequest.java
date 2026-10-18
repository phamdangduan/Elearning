package com.example.Elearning.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

/**
 * Payload webhook của SePay (https://docs.sepay.vn/tich-hop-webhooks.html).
 * Ví dụ:
 * {
 *   "id": 92704, "gateway": "MBBank", "transactionDate": "2026-10-17 14:02:37",
 *   "accountNumber": "9999999999", "code": "EDUAB12CD34", "content": "EDUAB12CD34 thanh toan",
 *   "transferType": "in", "transferAmount": 500000, "accumulated": 19077000,
 *   "subAccount": null, "referenceCode": "MBVCB.3278907687", "description": ""
 * }
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SepayWebhookRequest {
    /** ID giao dịch phía SePay — khóa idempotency. */
    Long id;
    String gateway;
    String transactionDate;
    String accountNumber;
    /** Mã thanh toán SePay tự tách theo prefix đã cấu hình (có thể null). */
    String code;
    String content;
    /** "in" = tiền vào, "out" = tiền ra. */
    String transferType;
    BigDecimal transferAmount;
    BigDecimal accumulated;
    String subAccount;
    /** Mã tham chiếu của ngân hàng. */
    String referenceCode;
    String description;
}
