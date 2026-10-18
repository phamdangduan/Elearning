package com.example.Elearning.controller;

import com.example.Elearning.dto.ApiResponse;
import com.example.Elearning.dto.request.CreatePaymentRequest;
import com.example.Elearning.dto.response.AdminPaymentStatsResponse;
import com.example.Elearning.dto.response.PaymentInfoResponse;
import com.example.Elearning.dto.response.PaymentRequestDetailResponse;
import com.example.Elearning.dto.response.PaymentRequestResponse;
import com.example.Elearning.dto.response.PaymentStatusResponse;
import com.example.Elearning.enums.PaymentStatus;
import com.example.Elearning.exception.SuccessCode;
import com.example.Elearning.security.CurrentUser;
import com.example.Elearning.service.PaymentRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/payment-requests")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PaymentRequestController {

    PaymentRequestService paymentRequestService;

    /** Admin: toàn bộ đơn (SecurityConfig giới hạn ROLE_ADMIN). */
    @GetMapping("/all")
    public ApiResponse<List<PaymentRequestResponse>> getAllPaymentRequests(
            @RequestParam(required = false) PaymentStatus status
    ) {
        return ApiResponse.ok(
                paymentRequestService.getAllPaymentRequests(status),
                SuccessCode.GET_PAYMENT_REQUESTS_SUCCESS
        );
    }

    @PostMapping("/create")
    public ApiResponse<PaymentRequestResponse> createPaymentRequest(
            @RequestParam(required = false) String userId,
            @Valid @RequestBody CreatePaymentRequest request
    ) {
        String studentId = CurrentUser.resolve(userId);
        return ApiResponse.ok(paymentRequestService.createPaymentRequest(studentId, request), SuccessCode.PAYMENT_REQUEST_CREATED);
    }

    @GetMapping("/my-payments")
    public ApiResponse<List<PaymentRequestResponse>> getMyPaymentRequests(
            @RequestParam(required = false) String userId
    ) {
        return ApiResponse.ok(
                paymentRequestService.getMyPaymentRequests(CurrentUser.resolve(userId)),
                SuccessCode.GET_PAYMENT_REQUESTS_SUCCESS);
    }

    /** Checkout polling mỗi 2 giây — response gọn, chỉ chủ đơn được xem. */
    @GetMapping("/{paymentRequestId}/status")
    public ApiResponse<PaymentStatusResponse> getPaymentStatus(@PathVariable String paymentRequestId) {
        return ApiResponse.ok(
                paymentRequestService.getPaymentStatus(CurrentUser.getUserId(), paymentRequestId),
                SuccessCode.GET_PAYMENT_STATUS_SUCCESS);
    }

    @GetMapping("/{paymentRequestId}")
    public ApiResponse<PaymentRequestDetailResponse> getPaymentRequestDetail(
            @PathVariable String paymentRequestId
    ) {
        return ApiResponse.ok(
                paymentRequestService.getPaymentRequestDetail(
                        CurrentUser.getUserId(), CurrentUser.isAdmin(), paymentRequestId),
                SuccessCode.GET_PAYMENT_DETAIL_SUCCESS);
    }

    @GetMapping("/courses/{courseId}/payment-info")
    public ApiResponse<PaymentInfoResponse> getPaymentInfoForCourse(
            @PathVariable String courseId
    ) { return ApiResponse.ok(paymentRequestService.getPaymentInfoForCourse(courseId), SuccessCode.GET_PAYMENT_INFO_SUCCESS);}

    /** Admin: thống kê (SecurityConfig giới hạn ROLE_ADMIN). */
    @GetMapping("/stats")
    public ApiResponse<AdminPaymentStatsResponse> getAdminPaymentStats() {
        return ApiResponse.ok(
                paymentRequestService.getAdminPaymentStats(),
                SuccessCode.GET_PAYMENT_REQUESTS_SUCCESS
        );
    }
}
