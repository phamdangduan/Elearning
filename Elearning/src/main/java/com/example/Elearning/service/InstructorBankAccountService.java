package com.example.Elearning.service;

import com.example.Elearning.dto.request.CreateBankAccountRequest;
import com.example.Elearning.dto.request.UpdateBankAccountRequest;
import com.example.Elearning.dto.response.BankAccountResponse;

import java.util.List;

public interface InstructorBankAccountService {
    BankAccountResponse createBankAccount(String userId, CreateBankAccountRequest request);
    BankAccountResponse updateBankAccount(String userId, String bankAccountId, UpdateBankAccountRequest request);
    void deleteBankAccount(String userId, String bankAccountId);
    List<BankAccountResponse> getBankAccounts(String userId);
    BankAccountResponse getPrimaryBankAccount(String userId);
    BankAccountResponse setPrimaryBankAccount(String userId, String bankAccountId);
}
