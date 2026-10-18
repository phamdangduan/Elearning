package com.example.Elearning.service.impl;

import com.example.Elearning.config.PaymentProperties;
import com.example.Elearning.dto.request.CreateWithdrawalRequest;
import com.example.Elearning.dto.request.ProcessWithdrawalRequest;
import com.example.Elearning.dto.response.WithdrawalResponse;
import com.example.Elearning.entity.InstructorBankAccount;
import com.example.Elearning.entity.User;
import com.example.Elearning.entity.WithdrawalRequest;
import com.example.Elearning.enums.WithdrawalStatus;
import com.example.Elearning.event.WithdrawalProcessedEvent;
import com.example.Elearning.exception.AppException;
import com.example.Elearning.exception.ErrorCode;
import com.example.Elearning.repository.BankAccountRepository;
import com.example.Elearning.repository.WithdrawalRequestRepository;
import com.example.Elearning.service.WalletService;
import com.example.Elearning.service.WithdrawalService;
import com.example.Elearning.utils.ReferenceCodeGenerator;
import com.example.Elearning.utils.VietQrUtil;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Luồng rút tiền:
 *   Giảng viên tạo yêu cầu → available trừ tạm sang locked
 *   Admin quét QR chuyển khoản → bấm "Xác nhận duyệt chi" → locked bị trừ vĩnh viễn
 *   Admin từ chối / giảng viên tự hủy → locked trả về available
 *
 * Thứ tự khóa: withdrawal_requests → instructor_wallets (tạo mới chỉ khóa ví).
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class WithdrawalServiceImpl implements WithdrawalService {

    private static final String CODE_PREFIX = "RUT";

    WithdrawalRequestRepository withdrawalRepository;
    BankAccountRepository bankAccountRepository;
    WalletService walletService;
    PaymentProperties paymentProperties;
    ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public WithdrawalResponse createWithdrawal(String instructorId, CreateWithdrawalRequest request) {
        BigDecimal amount = request.getAmount();
        BigDecimal min = paymentProperties.getWallet().getMinWithdrawal();
        // VND không có phần lẻ
        if (amount.stripTrailingZeros().scale() > 0 || (min != null && amount.compareTo(min) < 0)) {
            throw new AppException(ErrorCode.WITHDRAWAL_AMOUNT_INVALID);
        }

        // Khóa ví TRƯỚC khi kiểm tra yêu cầu đang chờ → 2 request rút đồng thời phải xếp hàng,
        // request sau sẽ thấy yêu cầu PENDING của request trước.
        walletService.lockWallet(instructorId);
        if (withdrawalRepository.existsByInstructorIdAndStatus(instructorId, WithdrawalStatus.PENDING)) {
            throw new AppException(ErrorCode.WITHDRAWAL_PENDING_EXISTS);
        }

        InstructorBankAccount bank = resolveBankAccount(instructorId, request.getBankAccountId());

        WithdrawalRequest withdrawal = WithdrawalRequest.builder()
                .code(generateUniqueCode())
                .instructorId(instructorId)
                .amount(amount)
                .status(WithdrawalStatus.PENDING)
                .bankAccountId(bank.getId())
                .bankName(bank.getBankName())
                .accountNumber(bank.getAccountNumber())
                .accountName(bank.getAccountName())
                .qrCodeUrl(bank.getQrCodeUrl())
                .instructorNote(request.getNote())
                .build();
        withdrawal = withdrawalRepository.save(withdrawal);

        walletService.holdForWithdrawal(instructorId, amount, withdrawal.getId());
        log.info("[Withdrawal] Giảng viên {} tạo yêu cầu rút {} ({})", instructorId, amount, withdrawal.getCode());
        return toResponse(withdrawal, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WithdrawalResponse> getMyWithdrawals(String instructorId) {
        return withdrawalRepository.findByInstructorIdOrderByCreatedAtDesc(instructorId).stream()
                .map(w -> toResponse(w, null))
                .toList();
    }

    @Override
    @Transactional
    public WithdrawalResponse cancelWithdrawal(String instructorId, String withdrawalId) {
        WithdrawalRequest withdrawal = lockPending(withdrawalId);
        if (!withdrawal.getInstructorId().equals(instructorId)) {
            throw new AppException(ErrorCode.WITHDRAWAL_NOT_FOUND);
        }
        withdrawal.setStatus(WithdrawalStatus.CANCELLED);
        withdrawal.setProcessedAt(LocalDateTime.now());
        withdrawalRepository.save(withdrawal);

        walletService.releaseWithdrawal(instructorId, withdrawal.getAmount(), withdrawal.getId(),
                "Giảng viên hủy yêu cầu rút tiền");
        return toResponse(withdrawal, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<WithdrawalResponse> getAllWithdrawals(WithdrawalStatus status) {
        return withdrawalRepository.findAllWithInstructor(status).stream()
                .map(w -> toResponse(w, w.getInstructor()))
                .toList();
    }

    @Override
    @Transactional
    public WithdrawalResponse approveWithdrawal(String adminId, String withdrawalId, ProcessWithdrawalRequest request) {
        WithdrawalRequest withdrawal = lockPending(withdrawalId);
        withdrawal.setStatus(WithdrawalStatus.APPROVED);
        withdrawal.setProcessedBy(adminId);
        withdrawal.setProcessedAt(LocalDateTime.now());
        if (request != null) {
            withdrawal.setAdminNote(request.getAdminNote());
            withdrawal.setBankTransactionRef(request.getBankTransactionRef());
        }
        withdrawalRepository.save(withdrawal);

        walletService.completeWithdrawal(withdrawal.getInstructorId(), withdrawal.getAmount(), withdrawal.getId());

        eventPublisher.publishEvent(new WithdrawalProcessedEvent(
                withdrawal.getId(), withdrawal.getInstructorId(), withdrawal.getAmount(), true, withdrawal.getAdminNote()));
        log.info("[Withdrawal] Admin {} đã chi {} cho yêu cầu {}", adminId, withdrawal.getAmount(), withdrawal.getCode());
        return toResponse(withdrawal, null);
    }

    @Override
    @Transactional
    public WithdrawalResponse rejectWithdrawal(String adminId, String withdrawalId, ProcessWithdrawalRequest request) {
        if (request == null || request.getAdminNote() == null || request.getAdminNote().isBlank()) {
            throw new AppException(ErrorCode.VALIDATION_ERROR);
        }
        WithdrawalRequest withdrawal = lockPending(withdrawalId);
        withdrawal.setStatus(WithdrawalStatus.REJECTED);
        withdrawal.setProcessedBy(adminId);
        withdrawal.setProcessedAt(LocalDateTime.now());
        withdrawal.setAdminNote(request.getAdminNote());
        withdrawalRepository.save(withdrawal);

        walletService.releaseWithdrawal(withdrawal.getInstructorId(), withdrawal.getAmount(), withdrawal.getId(),
                "Admin từ chối: " + request.getAdminNote());

        eventPublisher.publishEvent(new WithdrawalProcessedEvent(
                withdrawal.getId(), withdrawal.getInstructorId(), withdrawal.getAmount(), false, withdrawal.getAdminNote()));
        return toResponse(withdrawal, null);
    }

    // ─────────────────────────────────────────────────────────────────────────

    private WithdrawalRequest lockPending(String withdrawalId) {
        WithdrawalRequest withdrawal = withdrawalRepository.findByIdForUpdate(withdrawalId)
                .orElseThrow(() -> new AppException(ErrorCode.WITHDRAWAL_NOT_FOUND));
        if (withdrawal.getStatus() != WithdrawalStatus.PENDING) {
            throw new AppException(ErrorCode.WITHDRAWAL_NOT_PENDING);
        }
        return withdrawal;
    }

    private InstructorBankAccount resolveBankAccount(String instructorId, String bankAccountId) {
        InstructorBankAccount bank;
        if (bankAccountId == null || bankAccountId.isBlank()) {
            bank = bankAccountRepository.findByUserIdAndIsPrimaryTrue(instructorId)
                    .orElseThrow(() -> new AppException(ErrorCode.PRIMARY_BANK_ACCOUNT_NOT_FOUND));
        } else {
            bank = bankAccountRepository.findById(bankAccountId)
                    .filter(b -> b.getUserId().equals(instructorId))
                    .orElseThrow(() -> new AppException(ErrorCode.BANK_ACCOUNT_NOT_FOUND));
        }
        if (Boolean.FALSE.equals(bank.getIsActive())) {
            throw new AppException(ErrorCode.BANK_ACCOUNT_INACTIVE);
        }
        return bank;
    }

    private String generateUniqueCode() {
        for (int attempt = 0; attempt < 5; attempt++) {
            String code = ReferenceCodeGenerator.generate(CODE_PREFIX);
            if (!withdrawalRepository.existsByCode(code)) {
                return code;
            }
        }
        throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
    }

    private WithdrawalResponse toResponse(WithdrawalRequest w, User instructor) {
        String transferContent = "EDUVN " + w.getCode();
        String instructorName = null;
        String instructorEmail = null;
        if (instructor != null) {
            instructorEmail = instructor.getEmail();
            instructorName = instructor.getProfile() != null && instructor.getProfile().getFullName() != null
                    ? instructor.getProfile().getFullName()
                    : instructor.getUserName();
        }
        return WithdrawalResponse.builder()
                .id(w.getId())
                .code(w.getCode())
                .instructorId(w.getInstructorId())
                .instructorName(instructorName)
                .instructorEmail(instructorEmail)
                .amount(w.getAmount())
                .status(w.getStatus())
                .bankName(w.getBankName())
                .accountNumber(w.getAccountNumber())
                .accountName(w.getAccountName())
                .qrCodeUrl(w.getQrCodeUrl())
                .vietQrUrl(VietQrUtil.buildQrUrl(VietQrUtil.resolveBankCode(w.getBankName()),
                        w.getAccountNumber(), w.getAccountName(), w.getAmount(), transferContent))
                .transferContent(transferContent)
                .instructorNote(w.getInstructorNote())
                .adminNote(w.getAdminNote())
                .bankTransactionRef(w.getBankTransactionRef())
                .createdAt(w.getCreatedAt())
                .processedAt(w.getProcessedAt())
                .build();
    }
}
