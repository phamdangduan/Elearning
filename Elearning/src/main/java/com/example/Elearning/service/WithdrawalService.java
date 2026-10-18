package com.example.Elearning.service;

import com.example.Elearning.dto.request.CreateWithdrawalRequest;
import com.example.Elearning.dto.request.ProcessWithdrawalRequest;
import com.example.Elearning.dto.response.WithdrawalResponse;
import com.example.Elearning.enums.WithdrawalStatus;

import java.util.List;

public interface WithdrawalService {

    // Instructor
    WithdrawalResponse createWithdrawal(String instructorId, CreateWithdrawalRequest request);
    List<WithdrawalResponse> getMyWithdrawals(String instructorId);
    WithdrawalResponse cancelWithdrawal(String instructorId, String withdrawalId);

    // Admin
    List<WithdrawalResponse> getAllWithdrawals(WithdrawalStatus status);
    WithdrawalResponse approveWithdrawal(String adminId, String withdrawalId, ProcessWithdrawalRequest request);
    WithdrawalResponse rejectWithdrawal(String adminId, String withdrawalId, ProcessWithdrawalRequest request);
}
