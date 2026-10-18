package com.example.Elearning.controller;

import com.example.Elearning.dto.ApiResponse;
import com.example.Elearning.dto.response.PaymentRequestResponse;
import com.example.Elearning.enums.PaymentStatus;
import com.example.Elearning.exception.SuccessCode;
import com.example.Elearning.security.CurrentUser;
import com.example.Elearning.service.PaymentRequestService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Giảng viên xem các đơn mua khóa học của mình.
 * Mô hình sàn trung gian: tiền về tài khoản sàn và được xác nhận tự động qua webhook,
 * nên giảng viên không còn API confirm/reject.
 */
@RestController
@RequestMapping("/instructor/payment-requests")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class InstructorPaymentController {

    PaymentRequestService paymentRequestService;

    @GetMapping
    public ApiResponse<List<PaymentRequestResponse>> getInstructorPaymentRequests(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) PaymentStatus status
    ) {
        return ApiResponse.ok(
                paymentRequestService.getInstructorPaymentRequests(CurrentUser.resolve(userId), status),
                SuccessCode.GET_PAYMENT_REQUESTS_SUCCESS
        );
    }
}
