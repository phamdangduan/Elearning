-- ============================================================================
-- Migration: Thanh toán sàn trung gian (SePay webhook) + Ví giảng viên / Rút tiền
-- Chạy MỘT LẦN trên DB hiện có, TRƯỚC khi khởi động phiên bản backend mới.
--
-- Các bảng mới (instructor_wallets, wallet_transactions, withdrawal_requests,
-- payment_transactions) và cột mới của payment_requests do Hibernate (ddl-auto: update) tự tạo.
-- Riêng việc BỎ ràng buộc NOT NULL thì Hibernate update KHÔNG làm → phải chạy tay.
-- ============================================================================

-- Tiền giờ về tài khoản sàn, đơn mới không gắn tài khoản ngân hàng giảng viên
ALTER TABLE payment_requests MODIFY instructor_bank_account_id VARCHAR(36) NULL;

-- (Tùy chọn) Đơn PENDING của luồng cũ (chuyển khoản thẳng cho giảng viên, mã PAY-...) sẽ không bao giờ
-- được webhook khớp. Hủy để học viên tạo đơn mới theo luồng sàn:
-- UPDATE payment_requests SET status = 'CANCELLED' WHERE status = 'PENDING' AND reference_code LIKE 'PAY-%';
