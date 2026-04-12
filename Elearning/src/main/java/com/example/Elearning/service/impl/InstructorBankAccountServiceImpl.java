package com.example.Elearning.service.impl;

import com.example.Elearning.dto.request.CreateBankAccountRequest;
import com.example.Elearning.dto.request.UpdateBankAccountRequest;
import com.example.Elearning.dto.response.BankAccountResponse;
import com.example.Elearning.entity.InstructorBankAccount;
import com.example.Elearning.exception.AppException;
import com.example.Elearning.exception.ErrorCode;
import com.example.Elearning.mapper.BankAccountMapper;
import com.example.Elearning.repository.BankAccountRepository;
import com.example.Elearning.repository.UserRepository;
import com.example.Elearning.service.InstructorBankAccountService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;


@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class InstructorBankAccountServiceImpl implements InstructorBankAccountService {

    BankAccountMapper bankAccountMapper;
    BankAccountRepository bankAccountRepository;
    UserRepository userRepository;

    @Override
    public BankAccountResponse createBankAccount(String userId, CreateBankAccountRequest request) {

        var user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        boolean isTeacher = user.getRoles().stream()
                .anyMatch(role -> "TEACHER".equals(role.getName()));
        if (!isTeacher) {
            throw new AppException(ErrorCode.USER_NOT_TEACHER);
        }

        if (bankAccountRepository.existsByUserIdAndAccountNumber(userId, request.getAccountNumber())) {
            throw new AppException(ErrorCode.BANK_ACCOUNT_ALREADY_EXISTS);
        }

        var bank = bankAccountMapper.toEntity(request);

        bank.setUserId(userId);
        bank.setIsActive(true);

        List<InstructorBankAccount> existingAccounts = bankAccountRepository.findByUserId(userId);

        if (existingAccounts.isEmpty()) {

            bank.setIsPrimary(true);
        } else {

            if (Boolean.TRUE.equals(request.getIsPrimary())) {

                existingAccounts.stream()
                        .filter(InstructorBankAccount::getIsPrimary)
                        .forEach(acc -> {
                            acc.setIsPrimary(false);
                            bankAccountRepository.save(acc);
                        });
                bank.setIsPrimary(true);
            } else {
                bank.setIsPrimary(false);
            }
        }
        var savedBank = bankAccountRepository.save(bank);
        return bankAccountMapper.toResponse(savedBank);
    }

    @Override
    public BankAccountResponse updateBankAccount(String userId, String bankAccountId, UpdateBankAccountRequest request) {
        var bankAccount = bankAccountRepository.findById(bankAccountId)
                .orElseThrow(() -> new AppException(ErrorCode.BANK_ACCOUNT_NOT_FOUND));
        if (!bankAccount.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        if (!bankAccount.getAccountNumber().equals(request.getAccountNumber())) {
            if (bankAccountRepository.existsByUserIdAndAccountNumber(userId, request.getAccountNumber())) {
                throw new AppException(ErrorCode.BANK_ACCOUNT_ALREADY_EXISTS);
            }
        }
        bankAccount.setBankName(request.getBankName());
        bankAccount.setAccountNumber(request.getAccountNumber());
        bankAccount.setAccountName(request.getAccountName());
        if (request.getQrCodeUrl() != null) {
            bankAccount.setQrCodeUrl(request.getQrCodeUrl());
        }
        if (request.getIsActive() != null) {
            bankAccount.setIsActive(request.getIsActive());
        }
        if (Boolean.TRUE.equals(request.getIsPrimary()) && !bankAccount.getIsPrimary()) {
            bankAccountRepository.findByUserIdAndIsPrimaryTrue(userId)
                    .ifPresent(oldPrimary -> {
                        oldPrimary.setIsPrimary(false);
                        bankAccountRepository.save(oldPrimary);
                    });
            bankAccount.setIsPrimary(true);
        } else if (Boolean.FALSE.equals(request.getIsPrimary()) && bankAccount.getIsPrimary()) {
            List<InstructorBankAccount> allAccounts =
                    bankAccountRepository.findByUserId(userId);
            if (allAccounts.size() > 1) {
                bankAccount.setIsPrimary(false);
            }
        }
        var updated = bankAccountRepository.save(bankAccount);
        return bankAccountMapper.toResponse(updated);
    }

    @Override
    public void deleteBankAccount(String userId, String bankAccountId) {
        var bankAccount = bankAccountRepository.findById(bankAccountId)
                .orElseThrow(() -> new AppException(ErrorCode.BANK_ACCOUNT_NOT_FOUND));
        if (!bankAccount.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        if (bankAccount.getIsPrimary()) {
            List<InstructorBankAccount> allAccounts =
                    bankAccountRepository.findByUserId(userId);
            if (allAccounts.size() > 1) {
                throw new AppException(ErrorCode.CANNOT_DELETE_PRIMARY_BANK_ACCOUNT);
            }
        }
        bankAccountRepository.delete(bankAccount);

    }

    @Override
    public List<BankAccountResponse> getBankAccounts(String userId) {
        List<InstructorBankAccount> accounts =bankAccountRepository.findByUserId(userId);
        return bankAccountMapper.toResponseList(accounts);
    }

    @Override
    public BankAccountResponse getPrimaryBankAccount(String userId) {
        var account = bankAccountRepository.findByUserIdAndIsPrimaryTrue(userId)
                .orElseThrow(() -> new AppException(ErrorCode.PRIMARY_BANK_ACCOUNT_NOT_FOUND));
        return bankAccountMapper.toResponse(account);
    }

    @Override
    public BankAccountResponse setPrimaryBankAccount(String userId, String bankAccountId) {
        var bankAccount = bankAccountRepository.findById(bankAccountId)
                .orElseThrow(() -> new AppException(ErrorCode.BANK_ACCOUNT_NOT_FOUND));

        if (!bankAccount.getUserId().equals(userId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        bankAccountRepository.findByUserIdAndIsPrimaryTrue(userId)
                .ifPresent(oldPrimary -> {
                    oldPrimary.setIsPrimary(false);
                    bankAccountRepository.save(oldPrimary);
                });
        bankAccount.setIsPrimary(true);
        var updated = bankAccountRepository.save(bankAccount);
        return bankAccountMapper.toResponse(updated);
    }
}
