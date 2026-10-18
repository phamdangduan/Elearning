package com.example.Elearning.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AdminPaymentStatsResponse {
    BigDecimal totalRevenue;       // Tổng tiền học viên đã trả (GMV, chỉ CONFIRMED)
    BigDecimal platformRevenue;    // Doanh thu sàn = tổng hoa hồng giữ lại
    Long totalPayments;            // Tổng số giao dịch
    Long confirmedCount;           // Số giao dịch đã xác nhận
    Long pendingCount;             // Số giao dịch chờ xử lý
    Long rejectedCount;            // Số giao dịch bị từ chối
    Long expiredCount;             // Số giao dịch hết hạn
    Long cancelledCount;           // Số giao dịch đã hủy
}
