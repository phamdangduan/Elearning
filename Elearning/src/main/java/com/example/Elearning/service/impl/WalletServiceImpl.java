package com.example.Elearning.service.impl;

import com.example.Elearning.config.PaymentProperties;
import com.example.Elearning.dto.response.WalletResponse;
import com.example.Elearning.dto.response.WalletTransactionResponse;
import com.example.Elearning.entity.InstructorWallet;
import com.example.Elearning.entity.WalletTransaction;
import com.example.Elearning.enums.WalletTransactionType;
import com.example.Elearning.exception.AppException;
import com.example.Elearning.exception.ErrorCode;
import com.example.Elearning.repository.InstructorWalletRepository;
import com.example.Elearning.repository.WalletTransactionRepository;
import com.example.Elearning.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class WalletServiceImpl implements WalletService {

    InstructorWalletRepository walletRepository;
    WalletTransactionRepository walletTransactionRepository;
    PaymentProperties paymentProperties;
    TransactionTemplate transactionTemplate;

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public InstructorWallet lockWallet(String userId) {
        // Chỉ INSERT khi ví chưa tồn tại: INSERT IGNORE trên dòng đã có sẽ lấy shared lock,
        // rồi FOR UPDATE nâng lên exclusive → 2 transaction làm vậy cùng lúc sẽ deadlock.
        return walletRepository.findByUserIdForUpdate(userId).orElseGet(() -> {
            walletRepository.insertIfAbsent(userId);
            return walletRepository.findByUserIdForUpdate(userId)
                    .orElseThrow(() -> new IllegalStateException("Wallet not found after insert for user " + userId));
        });
    }

    @Override
    @Transactional
    public void ensureWallet(String userId) {
        if (walletRepository.findByUserId(userId).isEmpty()) {
            walletRepository.insertIfAbsent(userId);
        }
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void creditSale(String instructorId, BigDecimal amount, String paymentRequestId, String note) {
        if (amount == null || amount.signum() <= 0) {
            return;
        }
        InstructorWallet wallet = lockWallet(instructorId);
        int holdDays = paymentProperties.getWallet().getHoldDays();
        LocalDateTime now = LocalDateTime.now();
        boolean hold = holdDays > 0;

        wallet.setTotalEarned(wallet.getTotalEarned().add(amount));
        if (hold) {
            wallet.setPendingBalance(wallet.getPendingBalance().add(amount));
        } else {
            wallet.setAvailableBalance(wallet.getAvailableBalance().add(amount));
        }
        walletRepository.save(wallet);

        walletTransactionRepository.save(WalletTransaction.builder()
                .userId(instructorId)
                .type(WalletTransactionType.SALE_CREDIT)
                .amount(amount)
                .availableAfter(wallet.getAvailableBalance())
                .referenceId(paymentRequestId)
                .note(note)
                .availableAt(hold ? now.plusDays(holdDays) : now)
                .released(!hold)
                .build());

        log.info("[Wallet] +{} cho giảng viên {} ({}), payment {}", amount, instructorId,
                hold ? "tạm giữ " + holdDays + " ngày" : "khả dụng ngay", paymentRequestId);
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void holdForWithdrawal(String instructorId, BigDecimal amount, String withdrawalId) {
        InstructorWallet wallet = lockWallet(instructorId);
        if (wallet.getAvailableBalance().compareTo(amount) < 0) {
            throw new AppException(ErrorCode.INSUFFICIENT_BALANCE);
        }
        wallet.setAvailableBalance(wallet.getAvailableBalance().subtract(amount));
        wallet.setLockedBalance(wallet.getLockedBalance().add(amount));
        walletRepository.save(wallet);

        writeLedger(instructorId, WalletTransactionType.WITHDRAW_HOLD, amount, wallet, withdrawalId,
                "Tạm trừ cho yêu cầu rút tiền");
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void releaseWithdrawal(String instructorId, BigDecimal amount, String withdrawalId, String note) {
        InstructorWallet wallet = lockWallet(instructorId);
        wallet.setLockedBalance(wallet.getLockedBalance().subtract(amount));
        wallet.setAvailableBalance(wallet.getAvailableBalance().add(amount));
        walletRepository.save(wallet);

        writeLedger(instructorId, WalletTransactionType.WITHDRAW_RELEASE, amount, wallet, withdrawalId, note);
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public void completeWithdrawal(String instructorId, BigDecimal amount, String withdrawalId) {
        InstructorWallet wallet = lockWallet(instructorId);
        wallet.setLockedBalance(wallet.getLockedBalance().subtract(amount));
        wallet.setTotalWithdrawn(wallet.getTotalWithdrawn().add(amount));
        walletRepository.save(wallet);

        writeLedger(instructorId, WalletTransactionType.WITHDRAW_COMPLETE, amount, wallet, withdrawalId,
                "Admin đã chuyển tiền");
    }

    @Override
    public int releaseMaturedEarnings() {
        List<String> ids = walletTransactionRepository.findMaturedIds(
                WalletTransactionType.SALE_CREDIT, LocalDateTime.now(), PageRequest.of(0, 500));
        int released = 0;
        for (String id : ids) {
            // Mỗi khoản một transaction riêng: một khoản lỗi không chặn các khoản khác.
            try {
                Boolean done = transactionTemplate.execute(status -> releaseOne(id));
                if (Boolean.TRUE.equals(done)) {
                    released++;
                }
            } catch (Exception e) {
                log.error("[Wallet] Không giải phóng được khoản tạm giữ {}", id, e);
            }
        }
        if (released > 0) {
            log.info("[Wallet] Đã giải phóng {} khoản doanh thu hết thời gian tạm giữ", released);
        }
        return released;
    }

    /** Thứ tự khóa: ví → bút toán (giống creditSale) để tránh deadlock. */
    private boolean releaseOne(String transactionId) {
        WalletTransaction credit = walletTransactionRepository.findById(transactionId).orElse(null);
        if (credit == null || Boolean.TRUE.equals(credit.getReleased())) {
            return false;
        }
        InstructorWallet wallet = lockWallet(credit.getUserId());
        credit = walletTransactionRepository.findByIdForUpdate(transactionId).orElseThrow();
        if (Boolean.TRUE.equals(credit.getReleased())) {
            return false; // Luồng khác đã xử lý trong lúc chờ khóa
        }

        BigDecimal amount = credit.getAmount();
        wallet.setPendingBalance(wallet.getPendingBalance().subtract(amount));
        wallet.setAvailableBalance(wallet.getAvailableBalance().add(amount));
        walletRepository.save(wallet);

        credit.setReleased(true);
        walletTransactionRepository.save(credit);

        writeLedger(credit.getUserId(), WalletTransactionType.SALE_RELEASE, amount, wallet,
                credit.getReferenceId(), "Hết thời gian tạm giữ, cộng vào số dư khả dụng");
        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public WalletResponse getWallet(String userId) {
        var wallet = walletRepository.findByUserId(userId).orElse(null);
        List<WalletTransactionResponse> recent = walletTransactionRepository
                .findByUserIdOrderByCreatedAtDesc(userId, PageRequest.of(0, 50))
                .stream()
                .map(t -> WalletTransactionResponse.builder()
                        .id(t.getId())
                        .type(t.getType())
                        .amount(t.getAmount())
                        .availableAfter(t.getAvailableAfter())
                        .referenceId(t.getReferenceId())
                        .note(t.getNote())
                        .availableAt(t.getAvailableAt())
                        .released(t.getReleased())
                        .createdAt(t.getCreatedAt())
                        .build())
                .toList();

        return WalletResponse.builder()
                .userId(userId)
                .pendingBalance(wallet != null ? wallet.getPendingBalance() : BigDecimal.ZERO)
                .availableBalance(wallet != null ? wallet.getAvailableBalance() : BigDecimal.ZERO)
                .lockedBalance(wallet != null ? wallet.getLockedBalance() : BigDecimal.ZERO)
                .totalEarned(wallet != null ? wallet.getTotalEarned() : BigDecimal.ZERO)
                .totalWithdrawn(wallet != null ? wallet.getTotalWithdrawn() : BigDecimal.ZERO)
                .commissionRate(paymentProperties.getPlatform().getCommissionRate())
                .holdDays(paymentProperties.getWallet().getHoldDays())
                .minWithdrawal(paymentProperties.getWallet().getMinWithdrawal())
                .recentTransactions(recent)
                .build();
    }

    private void writeLedger(String userId, WalletTransactionType type, BigDecimal amount,
                             InstructorWallet wallet, String referenceId, String note) {
        walletTransactionRepository.save(WalletTransaction.builder()
                .userId(userId)
                .type(type)
                .amount(amount)
                .availableAfter(wallet.getAvailableBalance())
                .referenceId(referenceId)
                .note(note)
                .build());
    }
}
