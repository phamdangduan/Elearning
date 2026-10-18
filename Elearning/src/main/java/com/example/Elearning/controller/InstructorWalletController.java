package com.example.Elearning.controller;

import com.example.Elearning.dto.ApiResponse;
import com.example.Elearning.dto.request.CreateWithdrawalRequest;
import com.example.Elearning.dto.response.WalletResponse;
import com.example.Elearning.dto.response.WithdrawalResponse;
import com.example.Elearning.exception.SuccessCode;
import com.example.Elearning.security.CurrentUser;
import com.example.Elearning.service.WalletService;
import com.example.Elearning.service.WithdrawalService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Ví doanh thu & rút tiền của giảng viên.
 * Danh tính lấy từ JWT — không nhận userId từ client.
 */
@RestController
@RequestMapping("/instructor")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class InstructorWalletController {

    WalletService walletService;
    WithdrawalService withdrawalService;

    @GetMapping("/wallet")
    public ApiResponse<WalletResponse> getMyWallet() {
        return ApiResponse.ok(walletService.getWallet(CurrentUser.getUserId()), SuccessCode.GET_WALLET_SUCCESS);
    }

    @PostMapping("/withdrawals")
    public ApiResponse<WithdrawalResponse> createWithdrawal(@Valid @RequestBody CreateWithdrawalRequest request) {
        return ApiResponse.ok(
                withdrawalService.createWithdrawal(CurrentUser.getUserId(), request),
                SuccessCode.WITHDRAWAL_CREATED);
    }

    @GetMapping("/withdrawals")
    public ApiResponse<List<WithdrawalResponse>> getMyWithdrawals() {
        return ApiResponse.ok(
                withdrawalService.getMyWithdrawals(CurrentUser.getUserId()),
                SuccessCode.GET_WITHDRAWALS_SUCCESS);
    }

    @PutMapping("/withdrawals/{withdrawalId}/cancel")
    public ApiResponse<WithdrawalResponse> cancelWithdrawal(@PathVariable String withdrawalId) {
        return ApiResponse.ok(
                withdrawalService.cancelWithdrawal(CurrentUser.getUserId(), withdrawalId),
                SuccessCode.WITHDRAWAL_CANCELLED);
    }
}
