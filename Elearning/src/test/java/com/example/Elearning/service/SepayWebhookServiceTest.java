package com.example.Elearning.service;

import com.example.Elearning.config.PaymentProperties;
import com.example.Elearning.dto.request.SepayWebhookRequest;
import com.example.Elearning.entity.PaymentRequest;
import com.example.Elearning.enums.PaymentStatus;
import com.example.Elearning.enums.TransactionMatchStatus;
import com.example.Elearning.repository.EnrollmentRepository;
import com.example.Elearning.repository.PaymentRequestRepository;
import com.example.Elearning.repository.PaymentTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SepayWebhookServiceTest {

    private static final String PLATFORM_ACCOUNT = "9999999999";
    private static final String CODE = "EDUAB23CD45";

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;
    @Mock
    private PaymentRequestRepository paymentRequestRepository;
    @Mock
    private EnrollmentRepository enrollmentRepository;
    @Mock
    private PaymentSettlementService settlementService;

    private SepayWebhookService service;

    @BeforeEach
    void setUp() {
        PaymentProperties props = new PaymentProperties();
        props.setReferencePrefix("EDU");
        props.getPlatform().setAccountNumber(PLATFORM_ACCOUNT);
        service = new SepayWebhookService(paymentTransactionRepository, paymentRequestRepository,
                enrollmentRepository, settlementService, props);
    }

    private SepayWebhookRequest incoming(long amount, String content) {
        return SepayWebhookRequest.builder()
                .id(1001L)
                .gateway("MBBank")
                .accountNumber(PLATFORM_ACCOUNT)
                .transferType("in")
                .transferAmount(BigDecimal.valueOf(amount))
                .content(content)
                .build();
    }

    private PaymentRequest payment(PaymentStatus status) {
        return PaymentRequest.builder()
                .id("pay-1")
                .studentId("student-1")
                .courseId("course-1")
                .instructorId("teacher-1")
                .amount(new BigDecimal("500000.00"))
                .referenceCode(CODE)
                .status(status)
                .expiredAt(LocalDateTime.now().minusMinutes(1))
                .build();
    }

    @Test
    void retriedWebhook_isSkippedWithoutProcessing() {
        when(paymentTransactionRepository.existsByProviderAndProviderTransactionId("SEPAY", "1001")).thenReturn(true);

        var result = service.handle(incoming(500000, CODE), "{}");

        assertEquals(SepayWebhookService.Outcome.DUPLICATE_EVENT, result.outcome());
        verify(paymentTransactionRepository, never()).saveAndFlush(any());
        verifyNoInteractions(settlementService);
    }

    @Test
    void pendingPaymentWithExactAmount_isSettled() {
        PaymentRequest pending = payment(PaymentStatus.PENDING);
        when(paymentRequestRepository.findByReferenceCodeForUpdate(CODE)).thenReturn(Optional.of(pending));

        var result = service.handle(incoming(500000, CODE + " thanh toan khoa hoc"), "{}");

        assertEquals(TransactionMatchStatus.MATCHED, result.matchStatus());
        verify(settlementService).settle(eq(pending), eq(BigDecimal.valueOf(500000)), anyString());
    }

    @Test
    void expiredPaymentWithFullAmount_isRevived() {
        PaymentRequest expired = payment(PaymentStatus.EXPIRED);
        when(paymentRequestRepository.findByReferenceCodeForUpdate(CODE)).thenReturn(Optional.of(expired));

        var result = service.handle(incoming(500000, CODE), "{}");

        assertEquals(TransactionMatchStatus.MATCHED, result.matchStatus());
        verify(settlementService).settle(eq(expired), any(), contains("hồi sinh"));
    }

    @Test
    void alreadyConfirmedPayment_isFlaggedForRefund_notSettledTwice() {
        when(paymentRequestRepository.findByReferenceCodeForUpdate(CODE))
                .thenReturn(Optional.of(payment(PaymentStatus.CONFIRMED)));

        var result = service.handle(incoming(500000, CODE), "{}");

        assertEquals(TransactionMatchStatus.DUPLICATE, result.matchStatus());
        verifyNoInteractions(settlementService);
    }

    @Test
    void underpayment_isNotSettled() {
        when(paymentRequestRepository.findByReferenceCodeForUpdate(CODE))
                .thenReturn(Optional.of(payment(PaymentStatus.PENDING)));

        var result = service.handle(incoming(499999, CODE), "{}");

        assertEquals(TransactionMatchStatus.UNDERPAID, result.matchStatus());
        verifyNoInteractions(settlementService);
    }

    @Test
    void studentAlreadyOwnsCourse_isFlaggedForRefund() {
        when(paymentRequestRepository.findByReferenceCodeForUpdate(CODE))
                .thenReturn(Optional.of(payment(PaymentStatus.EXPIRED)));
        when(enrollmentRepository.existsByUserIdAndCourseId("student-1", "course-1")).thenReturn(true);

        var result = service.handle(incoming(500000, CODE), "{}");

        assertEquals(TransactionMatchStatus.DUPLICATE, result.matchStatus());
        verifyNoInteractions(settlementService);
    }

    @Test
    void outgoingTransfer_isIgnored() {
        SepayWebhookRequest out = incoming(500000, CODE);
        out.setTransferType("out");

        var result = service.handle(out, "{}");

        assertEquals(TransactionMatchStatus.IGNORED, result.matchStatus());
        verifyNoInteractions(paymentRequestRepository, settlementService);
    }

    @Test
    void transferToAnotherAccount_isIgnored() {
        SepayWebhookRequest other = incoming(500000, CODE);
        other.setAccountNumber("0123456789");

        var result = service.handle(other, "{}");

        assertEquals(TransactionMatchStatus.IGNORED, result.matchStatus());
        verifyNoInteractions(paymentRequestRepository, settlementService);
    }

    @Test
    void contentWithoutCode_isUnmatched() {
        var result = service.handle(incoming(500000, "chuyen tien hoc phi"), "{}");

        assertEquals(TransactionMatchStatus.UNMATCHED, result.matchStatus());
        verifyNoInteractions(paymentRequestRepository, settlementService);
    }

    @Test
    void extractReferenceCode_handlesBankFormatting() {
        assertEquals(CODE, service.extractReferenceCode(null, "MBVCB.3278907687.EDUAB23CD45.CT tu 0123"));
        assertEquals(CODE, service.extractReferenceCode(null, "eduab23cd45 thanh toan"));
        assertEquals(CODE, service.extractReferenceCode(null, "EDU-AB23-CD45"));
        assertEquals(CODE, service.extractReferenceCode(CODE, "noi dung bi cat"));
        assertNull(service.extractReferenceCode(null, "PAY-1234-5678-123456"));
    }

    @Test
    void split_feeAndEarningAlwaysSumToAmount() {
        var even = PaymentSettlementService.split(new BigDecimal("500000"), new BigDecimal("0.20"));
        assertEquals(0, even.platformFee().compareTo(new BigDecimal("100000")));
        assertEquals(0, even.instructorEarning().compareTo(new BigDecimal("400000")));

        var odd = PaymentSettlementService.split(new BigDecimal("333333"), new BigDecimal("0.20"));
        assertEquals(0, odd.platformFee().compareTo(new BigDecimal("66667")));
        assertEquals(0, odd.platformFee().add(odd.instructorEarning()).compareTo(new BigDecimal("333333")));
    }

    private static String anyString() {
        return org.mockito.ArgumentMatchers.anyString();
    }

    private static String contains(String part) {
        return org.mockito.ArgumentMatchers.contains(part);
    }
}
