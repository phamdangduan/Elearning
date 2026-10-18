package com.example.Elearning.service;

import com.example.Elearning.dto.request.ConfirmPaymentRequest;
import com.example.Elearning.dto.request.CreatePaymentRequest;
import com.example.Elearning.dto.request.RejectPaymentRequest;
import com.example.Elearning.dto.response.AdminPaymentStatsResponse;
import com.example.Elearning.dto.response.PaymentInfoResponse;
import com.example.Elearning.dto.response.PaymentRequestDetailResponse;
import com.example.Elearning.dto.response.PaymentRequestResponse;
import com.example.Elearning.dto.response.PaymentStatusResponse;
import com.example.Elearning.enums.PaymentStatus;

import java.util.List;

public interface PaymentRequestService {

    // Student APIs
    PaymentRequestResponse createPaymentRequest(String studentId, CreatePaymentRequest request);
    List<PaymentRequestResponse> getMyPaymentRequests(String studentId);
    PaymentStatusResponse getPaymentStatus(String studentId, String paymentRequestId);
    PaymentInfoResponse getPaymentInfoForCourse(String courseId);

    /** Chi tiết đơn — chỉ học viên sở hữu, giảng viên của khóa học hoặc admin được xem. */
    PaymentRequestDetailResponse getPaymentRequestDetail(String viewerId, boolean viewerIsAdmin, String paymentRequestId);

    // Instructor APIs (chỉ xem — tiền về tài khoản sàn, giảng viên không còn tự duyệt)
    List<PaymentRequestResponse> getInstructorPaymentRequests(String instructorId, PaymentStatus status);

    // Admin APIs
    List<PaymentRequestResponse> getAllPaymentRequests(PaymentStatus status);
    /** Xác nhận thủ công khi webhook bị lỡ (admin đã kiểm tra sao kê). Dùng chung logic chia tiền với webhook. */
    PaymentRequestResponse adminConfirmPayment(String paymentRequestId, ConfirmPaymentRequest request);
    PaymentRequestResponse adminRejectPayment(String paymentRequestId, RejectPaymentRequest request);
    AdminPaymentStatsResponse getAdminPaymentStats();

    // System APIs (Scheduled job)
    void expireOldPaymentRequests();
}
