package com.example.Elearning.controller;

import com.example.Elearning.dto.ApiResponse;
import com.example.Elearning.dto.request.ConfirmPaymentRequest;
import com.example.Elearning.dto.request.RejectPaymentRequest;
import com.example.Elearning.dto.response.PaymentRequestResponse;
import com.example.Elearning.enums.PaymentStatus;
import com.example.Elearning.exception.SuccessCode;
import com.example.Elearning.service.PaymentRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/instructor/payment-requests")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class InstructorPaymentController {
    PaymentRequestService paymentRequestService;

    @GetMapping
    public ApiResponse<List<PaymentRequestResponse>> getInstructorPaymentRequests(
            @RequestParam String userId,
            @RequestParam(required = false) PaymentStatus status
    ) {
        return ApiResponse.ok(
                paymentRequestService.getInstructorPaymentRequests(userId, status),
                SuccessCode.GET_PAYMENT_REQUESTS_SUCCESS
        );
    }

    @GetMapping("/debug-revenue")
    public ApiResponse<?> debugInstructorRevenue(@RequestParam String instructorId) {
        List<PaymentRequestResponse> allPayments = paymentRequestService.getInstructorPaymentRequests(instructorId, null);
        List<PaymentRequestResponse> confirmedPayments = paymentRequestService.getInstructorPaymentRequests(instructorId, PaymentStatus.CONFIRMED);
        
        java.math.BigDecimal totalConfirmed = confirmedPayments.stream()
                .map(p -> p.getAmount())
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        
        return ApiResponse.ok(
                java.util.Map.of(
                        "instructorId", instructorId,
                        "totalPayments", allPayments.size(),
                        "confirmedPayments", confirmedPayments.size(),
                        "totalConfirmedRevenue", totalConfirmed,
                        "allPayments", allPayments,
                        "confirmedPaymentsList", confirmedPayments
                ),
                SuccessCode.GET_PAYMENT_REQUESTS_SUCCESS
        );
    }

    @PutMapping("/{paymentRequestId}/confirm")
    public ApiResponse<PaymentRequestResponse> confirmPaymentRequest(
            @RequestParam String userId,
            @PathVariable String paymentRequestId,
            @Valid @RequestBody ConfirmPaymentRequest request
    ) {
        return ApiResponse.ok(
                paymentRequestService.confirmPaymentRequest(userId, paymentRequestId, request),
                SuccessCode.PAYMENT_CONFIRMED
        );
    }

    @PutMapping("/{paymentRequestId}/reject")
    public ApiResponse<PaymentRequestResponse> rejectPaymentRequest(
            @RequestParam String userId,
            @PathVariable String paymentRequestId,
            @Valid @RequestBody RejectPaymentRequest request
    ) {
        return ApiResponse.ok(
                paymentRequestService.rejectPaymentRequest(userId, paymentRequestId, request),
                SuccessCode.PAYMENT_REJECTED
        );
    }
}
