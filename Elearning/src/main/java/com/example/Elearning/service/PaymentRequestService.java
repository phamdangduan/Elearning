package com.example.Elearning.service;

import com.example.Elearning.dto.request.ConfirmPaymentRequest;
import com.example.Elearning.dto.request.CreatePaymentRequest;
import com.example.Elearning.dto.request.RejectPaymentRequest;
import com.example.Elearning.dto.request.UploadPaymentProofRequest;
import com.example.Elearning.dto.response.PaymentInfoResponse;
import com.example.Elearning.dto.response.PaymentRequestDetailResponse;
import com.example.Elearning.dto.response.PaymentRequestResponse;
import com.example.Elearning.enums.PaymentStatus;

import java.util.List;

public interface PaymentRequestService {
    // Student APIs

    List<PaymentRequestResponse> getAllPaymentRequests(PaymentStatus status);

    PaymentRequestResponse createPaymentRequest(String studentId, CreatePaymentRequest request);
    PaymentRequestResponse uploadPaymentProof(String studentId, String paymentRequestId, UploadPaymentProofRequest request);
    List<PaymentRequestResponse> getMyPaymentRequests(String studentId);
    PaymentRequestDetailResponse getPaymentRequestDetail(String paymentRequestId);
    PaymentInfoResponse getPaymentInfoForCourse(String courseId);

    // Instructor APIs
    PaymentRequestResponse confirmPaymentRequest(String instructorId, String paymentRequestId, ConfirmPaymentRequest request);
    PaymentRequestResponse rejectPaymentRequest(String instructorId, String paymentRequestId, RejectPaymentRequest request);
    List<PaymentRequestResponse> getInstructorPaymentRequests(String instructorId, PaymentStatus status);

    // System APIs (Scheduled job)
    void expireOldPaymentRequests();
}
