package com.example.Elearning.controller;

import com.example.Elearning.dto.ApiResponse;
import com.example.Elearning.dto.request.ConfirmPaymentRequest;
import com.example.Elearning.dto.request.CreatePaymentRequest;
import com.example.Elearning.dto.request.RejectPaymentRequest;
import com.example.Elearning.dto.request.UploadPaymentProofRequest;
import com.example.Elearning.dto.response.PaymentInfoResponse;
import com.example.Elearning.dto.response.PaymentRequestDetailResponse;
import com.example.Elearning.dto.response.PaymentRequestResponse;
import com.example.Elearning.enums.PaymentStatus;
import com.example.Elearning.exception.SuccessCode;
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
            @RequestParam String userId,
            @Valid @RequestBody CreatePaymentRequest request
    ) { return ApiResponse.ok(paymentRequestService.createPaymentRequest(userId, request), SuccessCode.PAYMENT_REQUEST_CREATED);}

    @PutMapping("/{paymentRequestId}/upload-proof")
    public ApiResponse<PaymentRequestResponse> uploadPaymentProof(
            @RequestParam String userId,
            @PathVariable String paymentRequestId,
            @Valid @RequestBody UploadPaymentProofRequest request
    ) { return ApiResponse.ok(paymentRequestService.uploadPaymentProof(userId, paymentRequestId, request), SuccessCode.PAYMENT_PROOF_UPLOADED);}

    @GetMapping("/my-payments")
    public ApiResponse<List<PaymentRequestResponse>> getMyPaymentRequests(
            @RequestParam String userId
    ) { return ApiResponse.ok(paymentRequestService.getMyPaymentRequests(userId), SuccessCode.GET_PAYMENT_REQUESTS_SUCCESS);}

    @GetMapping("/{paymentRequestId}")
    public ApiResponse<PaymentRequestDetailResponse> getPaymentRequestDetail(
            @PathVariable String paymentRequestId
    ) { return ApiResponse.ok(paymentRequestService.getPaymentRequestDetail(paymentRequestId), SuccessCode.GET_PAYMENT_DETAIL_SUCCESS);}

    @GetMapping("/courses/{courseId}/payment-info")
    public ApiResponse<PaymentInfoResponse> getPaymentInfoForCourse(
            @PathVariable String courseId
    ) { return ApiResponse.ok(paymentRequestService.getPaymentInfoForCourse(courseId), SuccessCode.GET_PAYMENT_INFO_SUCCESS);}

}
