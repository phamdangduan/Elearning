package com.example.Elearning.controller;

import com.example.Elearning.dto.ApiResponse;
import com.example.Elearning.dto.request.ProcessWithdrawalRequest;
import com.example.Elearning.dto.response.WithdrawalResponse;
import com.example.Elearning.enums.WithdrawalStatus;
import com.example.Elearning.exception.SuccessCode;
import com.example.Elearning.security.CurrentUser;
import com.example.Elearning.service.WithdrawalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Admin/Kế toán duyệt chi rút tiền. /admin/** chỉ ROLE_ADMIN (SecurityConfig). */
@RestController
@RequestMapping("/admin/withdrawals")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AdminWithdrawalController {

    WithdrawalService withdrawalService;

    @GetMapping
    public ApiResponse<List<WithdrawalResponse>> getWithdrawals(
            @RequestParam(required = false) WithdrawalStatus status) {
        return ApiResponse.ok(withdrawalService.getAllWithdrawals(status), SuccessCode.GET_WITHDRAWALS_SUCCESS);
    }

    @PutMapping("/{withdrawalId}/approve")
    public ApiResponse<WithdrawalResponse> approve(
            @PathVariable String withdrawalId,
            @Valid @RequestBody(required = false) ProcessWithdrawalRequest request) {
        return ApiResponse.ok(
                withdrawalService.approveWithdrawal(CurrentUser.getUserId(), withdrawalId, request),
                SuccessCode.WITHDRAWAL_APPROVED);
    }

    @PutMapping("/{withdrawalId}/reject")
    public ApiResponse<WithdrawalResponse> reject(
            @PathVariable String withdrawalId,
            @Valid @RequestBody ProcessWithdrawalRequest request) {
        return ApiResponse.ok(
                withdrawalService.rejectWithdrawal(CurrentUser.getUserId(), withdrawalId, request),
                SuccessCode.WITHDRAWAL_REJECTED);
    }
}
