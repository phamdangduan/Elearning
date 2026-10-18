package com.example.Elearning.service;

import com.example.Elearning.dto.response.WalletResponse;
import com.example.Elearning.entity.InstructorWallet;

import java.math.BigDecimal;

/**
 * Mọi thay đổi số dư ví giảng viên đều đi qua service này:
 * khóa dòng ví (SELECT ... FOR UPDATE) → cập nhật số dư → ghi một bút toán vào sổ cái.
 *
 * Các hàm thay đổi số dư yêu cầu đang có transaction (Propagation.MANDATORY)
 * để luôn commit/rollback cùng nghiệp vụ gọi nó (xác nhận thanh toán, duyệt rút tiền...).
 */
public interface WalletService {

    /** Lấy (tạo nếu chưa có) và khóa ví của giảng viên trong transaction hiện tại. */
    InstructorWallet lockWallet(String userId);

    /**
     * Tạo sẵn ví (nếu chưa có) trong transaction riêng, gọi ở lúc tạo đơn.
     * Nhờ đó webhook gần như luôn gặp ví đã tồn tại và chỉ cần SELECT ... FOR UPDATE.
     */
    void ensureWallet(String userId);

    /** Cộng doanh thu bán khóa học: vào pending nếu có thời gian tạm giữ, ngược lại vào available. */
    void creditSale(String instructorId, BigDecimal amount, String paymentRequestId, String note);

    /** Trừ tạm thời số dư khả dụng cho một yêu cầu rút: available → locked. */
    void holdForWithdrawal(String instructorId, BigDecimal amount, String withdrawalId);

    /** Hoàn lại tiền của yêu cầu rút bị từ chối/hủy: locked → available. */
    void releaseWithdrawal(String instructorId, BigDecimal amount, String withdrawalId, String note);

    /** Admin đã chuyển tiền: trừ vĩnh viễn khỏi locked. */
    void completeWithdrawal(String instructorId, BigDecimal amount, String withdrawalId);

    /** Chuyển các khoản đã hết thời gian tạm giữ từ pending sang available. Trả về số khoản đã xử lý. */
    int releaseMaturedEarnings();

    WalletResponse getWallet(String userId);
}
