package com.example.Elearning.controller;

import com.example.Elearning.dto.ApiResponse;
import com.example.Elearning.dto.request.CreateBankAccountRequest;
import com.example.Elearning.dto.request.UpdateBankAccountRequest;
import com.example.Elearning.dto.response.BankAccountResponse;
import com.example.Elearning.exception.SuccessCode;
import com.example.Elearning.service.InstructorBankAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/bank-account")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class BankAccountController {
    private final InstructorBankAccountService instructorBankAccountService;

    @PostMapping("/create")
    public ApiResponse<BankAccountResponse> createBankAccount(
            @RequestParam String userId,
            @Valid @RequestBody CreateBankAccountRequest request
    ) {
        return ApiResponse.ok(instructorBankAccountService.createBankAccount(userId, request), SuccessCode.BANK_ACCOUNT_CREATED);}

    @PutMapping("/{bankAccountId}/update")
    public ApiResponse<BankAccountResponse> updateBankAccount(
            @RequestParam String userId,
            @PathVariable String bankAccountId,
            @Valid @RequestBody UpdateBankAccountRequest request
    ) {
        return ApiResponse.ok(instructorBankAccountService.updateBankAccount(userId, bankAccountId, request), SuccessCode.BANK_ACCOUNT_UPDATED);}

    @DeleteMapping("/{bankAccountId}")
    public ApiResponse<Void> deleteBankAccount(
            @RequestParam String userId,
            @PathVariable String bankAccountId
    ) {
        instructorBankAccountService.deleteBankAccount(userId, bankAccountId);
        return ApiResponse.ok(null, SuccessCode.BANK_ACCOUNT_DELETED);}

    @GetMapping("/my-account")
    public ApiResponse<List<BankAccountResponse>> getBankAccounts(
            @RequestParam String userId
    ) {
        return ApiResponse.ok(instructorBankAccountService.getBankAccounts(userId), SuccessCode.GET_BANK_ACCOUNTS_SUCCESS);
    }

    @GetMapping("/primary")
    public ApiResponse<BankAccountResponse> getPrimaryBankAccount(
            @RequestParam String userId
    ) {
        return ApiResponse.ok(instructorBankAccountService.getPrimaryBankAccount(userId), SuccessCode.GET_BANK_ACCOUNT_SUCCESS);
    }

    @PatchMapping("/{bankAccountId}/set-primary")
    public ApiResponse<BankAccountResponse> setPrimaryBankAccount(
            @RequestParam String userId,
            @PathVariable String bankAccountId
    ) {
        return ApiResponse.ok(instructorBankAccountService.setPrimaryBankAccount(userId, bankAccountId), SuccessCode.BANK_ACCOUNT_UPDATED);
    }

}
