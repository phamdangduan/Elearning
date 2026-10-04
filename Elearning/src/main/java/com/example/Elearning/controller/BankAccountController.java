package com.example.Elearning.controller;

import com.example.Elearning.dto.ApiResponse;
import com.example.Elearning.dto.request.CreateBankAccountRequest;
import com.example.Elearning.dto.request.UpdateBankAccountRequest;
import com.example.Elearning.dto.response.BankAccountResponse;
import com.example.Elearning.dto.response.FileUploadResponse;
import com.example.Elearning.exception.ErrorCode;
import com.example.Elearning.exception.SuccessCode;
import com.example.Elearning.exception.AppException;
import com.example.Elearning.security.CurrentUser;
import com.example.Elearning.service.FileStorageService;
import com.example.Elearning.service.InstructorBankAccountService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/bank-account")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class BankAccountController {
    InstructorBankAccountService instructorBankAccountService;
    FileStorageService fileStorageService;

    @PostMapping("/create")
    public ApiResponse<BankAccountResponse> createBankAccount(
            @RequestParam(required = false) String userId,
            @Valid @RequestBody CreateBankAccountRequest request
    ) {
        userId = CurrentUser.resolve(userId);
        return ApiResponse.ok(instructorBankAccountService.createBankAccount(userId, request), SuccessCode.BANK_ACCOUNT_CREATED);}

    @PutMapping("/{bankAccountId}/update")
    public ApiResponse<BankAccountResponse> updateBankAccount(
            @RequestParam(required = false) String userId,
            @PathVariable String bankAccountId,
            @Valid @RequestBody UpdateBankAccountRequest request
    ) {
        userId = CurrentUser.resolve(userId);
        return ApiResponse.ok(instructorBankAccountService.updateBankAccount(userId, bankAccountId, request), SuccessCode.BANK_ACCOUNT_UPDATED);}

    @DeleteMapping("/{bankAccountId}")
    public ApiResponse<Void> deleteBankAccount(
            @RequestParam(required = false) String userId,
            @PathVariable String bankAccountId
    ) {
        userId = CurrentUser.resolve(userId);
        instructorBankAccountService.deleteBankAccount(userId, bankAccountId);
        return ApiResponse.ok(null, SuccessCode.BANK_ACCOUNT_DELETED);}

    @GetMapping("/my-account")
    public ApiResponse<List<BankAccountResponse>> getBankAccounts(
            @RequestParam(required = false) String userId
    ) {
        userId = CurrentUser.resolve(userId);
        return ApiResponse.ok(instructorBankAccountService.getBankAccounts(userId), SuccessCode.GET_BANK_ACCOUNTS_SUCCESS);
    }

    @GetMapping("/primary")
    public ApiResponse<BankAccountResponse> getPrimaryBankAccount(
            @RequestParam(required = false) String userId
    ) {
        userId = CurrentUser.resolve(userId);
        return ApiResponse.ok(instructorBankAccountService.getPrimaryBankAccount(userId), SuccessCode.GET_BANK_ACCOUNT_SUCCESS);
    }

    @PatchMapping("/{bankAccountId}/set-primary")
    public ApiResponse<BankAccountResponse> setPrimaryBankAccount(
            @RequestParam(required = false) String userId,
            @PathVariable String bankAccountId
    ) {
        userId = CurrentUser.resolve(userId);
        return ApiResponse.ok(instructorBankAccountService.setPrimaryBankAccount(userId, bankAccountId), SuccessCode.BANK_ACCOUNT_UPDATED);
    }

    @PostMapping(value = "/upload-qr", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<FileUploadResponse> uploadQrCode(
            @RequestPart("image") MultipartFile imageFile,
            @RequestParam(required = false) String userId) {
        userId = CurrentUser.resolve(userId);

        if (userId == null || userId.isEmpty()) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        FileUploadResponse response = fileStorageService.uploadImage(imageFile, "qr-codes");
        return ApiResponse.ok(response, SuccessCode.FILE_UPLOADED);
    }

}
