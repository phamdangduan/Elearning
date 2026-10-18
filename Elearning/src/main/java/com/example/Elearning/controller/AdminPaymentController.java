package com.example.Elearning.controller;

import com.example.Elearning.dto.ApiResponse;
import com.example.Elearning.dto.request.ConfirmPaymentRequest;
import com.example.Elearning.dto.request.RejectPaymentRequest;
import com.example.Elearning.dto.response.PaymentRequestResponse;
import com.example.Elearning.entity.PaymentTransaction;
import com.example.Elearning.exception.SuccessCode;
import com.example.Elearning.repository.PaymentTransactionRepository;
import com.example.Elearning.service.PaymentRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin xử lý ngoại lệ thanh toán. /admin/** chỉ ROLE_ADMIN (SecurityConfig).
 * Luồng chính là webhook tự động; các API này dành cho trường hợp webhook bị lỡ hoặc cần đối soát.
 */
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AdminPaymentController {

    PaymentRequestService paymentRequestService;
    PaymentTransactionRepository paymentTransactionRepository;

    @PutMapping("/payment-requests/{paymentRequestId}/confirm")
    public ApiResponse<PaymentRequestResponse> confirm(
            @PathVariable String paymentRequestId,
            @Valid @RequestBody(required = false) ConfirmPaymentRequest request) {
        return ApiResponse.ok(paymentRequestService.adminConfirmPayment(paymentRequestId, request),
                SuccessCode.PAYMENT_CONFIRMED);
    }

    @PutMapping("/payment-requests/{paymentRequestId}/reject")
    public ApiResponse<PaymentRequestResponse> reject(
            @PathVariable String paymentRequestId,
            @Valid @RequestBody RejectPaymentRequest request) {
        return ApiResponse.ok(paymentRequestService.adminRejectPayment(paymentRequestId, request),
                SuccessCode.PAYMENT_REJECTED);
    }

    /** Nhật ký giao dịch ngân hàng từ webhook — để đối soát UNMATCHED / UNDERPAID / DUPLICATE. */
    @GetMapping("/payment-transactions")
    public ApiResponse<List<PaymentTransaction>> getTransactions() {
        return ApiResponse.ok(paymentTransactionRepository.findAllByOrderByCreatedAtDesc(),
                SuccessCode.GET_PAYMENT_REQUESTS_SUCCESS);
    }
}
