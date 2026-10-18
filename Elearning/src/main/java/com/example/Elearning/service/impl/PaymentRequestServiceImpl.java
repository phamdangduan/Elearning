package com.example.Elearning.service.impl;

import com.example.Elearning.config.PaymentProperties;
import com.example.Elearning.dto.request.ConfirmPaymentRequest;
import com.example.Elearning.dto.request.CreatePaymentRequest;
import com.example.Elearning.dto.request.RejectPaymentRequest;
import com.example.Elearning.dto.response.AdminPaymentStatsResponse;
import com.example.Elearning.dto.response.PaymentInfoResponse;
import com.example.Elearning.dto.response.PaymentRequestDetailResponse;
import com.example.Elearning.dto.response.PaymentRequestResponse;
import com.example.Elearning.dto.response.PaymentStatusResponse;
import com.example.Elearning.entity.PaymentRequest;
import com.example.Elearning.enums.CourseStatus;
import com.example.Elearning.enums.NotificationType;
import com.example.Elearning.enums.PaymentStatus;
import com.example.Elearning.exception.AppException;
import com.example.Elearning.exception.ErrorCode;
import com.example.Elearning.mapper.PaymentRequestMapper;
import com.example.Elearning.repository.CourseRepository;
import com.example.Elearning.repository.EnrollmentRepository;
import com.example.Elearning.repository.PaymentRequestRepository;
import com.example.Elearning.repository.UserRepository;
import com.example.Elearning.service.NotificationService;
import com.example.Elearning.service.PaymentRequestService;
import com.example.Elearning.service.PaymentSettlementService;
import com.example.Elearning.service.WalletService;
import com.example.Elearning.utils.ReferenceCodeGenerator;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PaymentRequestServiceImpl implements PaymentRequestService {

    PaymentRequestRepository paymentRequestRepository;
    PaymentRequestMapper paymentRequestMapper;
    CourseRepository courseRepository;
    EnrollmentRepository enrollmentRepository;
    UserRepository userRepository;
    NotificationService notificationService;
    PaymentSettlementService settlementService;
    WalletService walletService;
    PaymentProperties paymentProperties;

    private String generateUniqueReferenceCode() {
        for (int attempt = 0; attempt < 5; attempt++) {
            String code = ReferenceCodeGenerator.generate(paymentProperties.getReferencePrefix().toUpperCase());
            if (!paymentRequestRepository.existsByReferenceCode(code)) {
                return code;
            }
        }
        throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);
    }

    private Long calculateTimeRemaining(LocalDateTime expiredAt) {
        if (expiredAt == null) {
            return null;
        }
        LocalDateTime now = LocalDateTime.now();
        if (now.isAfter(expiredAt)) {
            return 0L;
        }
        return java.time.Duration.between(now, expiredAt).getSeconds();
    }

    @Override
    public List<PaymentRequestResponse> getAllPaymentRequests(PaymentStatus status) {
        List<PaymentRequest> paymentRequests;
        if (status != null) {
            paymentRequests = paymentRequestRepository.findByStatus(status);
        } else {
            paymentRequests = paymentRequestRepository.findAllWithDetails();
        }
        return paymentRequests.stream()
                .map(paymentRequestMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PaymentRequestResponse createPaymentRequest(String studentId, CreatePaymentRequest request) {
        // 1. Validate course exists và đang mở bán
        var course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
        if (course.getStatus() != CourseStatus.PUBLISHED) {
            throw new AppException(ErrorCode.COURSE_NOT_FOUND);
        }

        // 2. Check course price > 0
        if (course.getPrice() == null || course.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.COURSE_PRICE_ZERO);
        }

        // 3. Check student chưa enroll
        if (enrollmentRepository.existsByUserIdAndCourseId(studentId, request.getCourseId())) {
            throw new AppException(ErrorCode.ALREADY_ENROLLED);
        }

        // 4. Đơn PENDING còn hạn → báo trùng (FE sẽ dùng lại đơn đó). Đơn PENDING đã quá hạn
        //    nhưng scheduler chưa kịp quét → đánh dấu EXPIRED để tạo đơn mới.
        var existingPayment = paymentRequestRepository
                .findByStudentIdAndCourseIdAndStatus(studentId, request.getCourseId(), PaymentStatus.PENDING);
        if (existingPayment.isPresent()) {
            PaymentRequest existing = existingPayment.get();
            if (existing.getExpiredAt() != null && existing.getExpiredAt().isAfter(LocalDateTime.now())) {
                throw new AppException(ErrorCode.PAYMENT_ALREADY_EXISTS);
            }
            paymentRequestRepository.expireIfPending(existing.getId());
        }

        var student = userRepository.findById(studentId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        var instructor = course.getUser();

        // 5. Tạo sẵn ví giảng viên để webhook chỉ cần khóa dòng có sẵn
        walletService.ensureWallet(instructor.getId());

        // 6. Tạo đơn — tiền chuyển vào tài khoản của sàn, không cần tài khoản ngân hàng giảng viên
        var paymentRequest = PaymentRequest.builder()
                .studentId(studentId)
                .courseId(course.getId())
                .instructorId(instructor.getId())
                .amount(course.getPrice())
                .status(PaymentStatus.PENDING)
                .referenceCode(generateUniqueReferenceCode())
                .expiredAt(LocalDateTime.now().plusMinutes(paymentProperties.getExpireMinutes()))
                .build();

        var saved = paymentRequestRepository.save(paymentRequest);

        return PaymentRequestResponse.builder()
                .id(saved.getId())
                .studentId(saved.getStudentId())
                .studentName(student.getUserName())
                .courseId(saved.getCourseId())
                .courseTitle(course.getTitle())
                .courseThumbnail(course.getThumbnailUrl())
                .instructorId(saved.getInstructorId())
                .instructorName(instructor.getUserName())
                .amount(saved.getAmount())
                .status(saved.getStatus())
                .referenceCode(saved.getReferenceCode())
                .createdAt(saved.getCreatedAt())
                .expiredAt(saved.getExpiredAt())
                .timeRemainingSeconds(calculateTimeRemaining(saved.getExpiredAt()))
                .build();
    }

    @Override
    public List<PaymentRequestResponse> getMyPaymentRequests(String studentId) {
        var payments = paymentRequestRepository.findByStudentIdWithDetailsOrderByCreatedAtDesc(studentId);
        return paymentRequestMapper.toResponseList(payments);
    }

    @Override
    public PaymentStatusResponse getPaymentStatus(String studentId, String paymentRequestId) {
        var payment = paymentRequestRepository.findById(paymentRequestId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_REQUEST_NOT_FOUND));
        if (!payment.getStudentId().equals(studentId)) {
            throw new AppException(ErrorCode.PAYMENT_REQUEST_NOT_FOUND);
        }
        return PaymentStatusResponse.builder()
                .id(payment.getId())
                .courseId(payment.getCourseId())
                .status(payment.getStatus())
                .expiredAt(payment.getExpiredAt())
                .confirmedAt(payment.getConfirmedAt())
                .timeRemainingSeconds(calculateTimeRemaining(payment.getExpiredAt()))
                .build();
    }

    @Override
    public PaymentRequestDetailResponse getPaymentRequestDetail(String viewerId, boolean viewerIsAdmin, String paymentRequestId) {
        var payment = paymentRequestRepository.findByIdWithDetails(paymentRequestId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_REQUEST_NOT_FOUND));
        boolean allowed = viewerIsAdmin
                || payment.getStudentId().equals(viewerId)
                || payment.getInstructorId().equals(viewerId);
        if (!allowed) {
            throw new AppException(ErrorCode.PAYMENT_REQUEST_NOT_FOUND);
        }
        return paymentRequestMapper.toDetailResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentInfoResponse getPaymentInfoForCourse(String courseId) {
        var course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
        var platform = paymentProperties.getPlatform();

        // Mô hình sàn trung gian: học viên luôn chuyển vào tài khoản DUY NHẤT của sàn
        return PaymentInfoResponse.builder()
                .instructorName(course.getUser().getUserName())
                .bankName(platform.getBankName())
                .bankCode(platform.getBankCode())
                .accountNumber(platform.getAccountNumber())
                .accountName(platform.getAccountName())
                .amount(course.getPrice())
                .note("Chuyển khoản đúng số tiền và nội dung. Hệ thống tự động kích hoạt khóa học sau vài giây.")
                .build();
    }

    @Override
    @Transactional
    public PaymentRequestResponse adminConfirmPayment(String paymentRequestId, ConfirmPaymentRequest request) {
        var payment = paymentRequestRepository.findByIdForUpdate(paymentRequestId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_REQUEST_NOT_FOUND));
        if (payment.getStatus() == PaymentStatus.CONFIRMED) {
            throw new AppException(ErrorCode.PAYMENT_ALREADY_CONFIRMED);
        }
        if (enrollmentRepository.existsByUserIdAndCourseId(payment.getStudentId(), payment.getCourseId())) {
            throw new AppException(ErrorCode.ALREADY_ENROLLED);
        }
        String note = request != null && request.getInstructorNote() != null && !request.getInstructorNote().isBlank()
                ? "Admin xác nhận thủ công: " + request.getInstructorNote()
                : "Admin xác nhận thủ công";
        settlementService.settle(payment, payment.getAmount(), note);
        return paymentRequestMapper.toResponse(payment);
    }

    @Override
    @Transactional
    public PaymentRequestResponse adminRejectPayment(String paymentRequestId, RejectPaymentRequest request) {
        var payment = paymentRequestRepository.findByIdForUpdate(paymentRequestId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_REQUEST_NOT_FOUND));
        if (payment.getStatus() == PaymentStatus.CONFIRMED) {
            throw new AppException(ErrorCode.PAYMENT_CANNOT_CONFIRM);
        }
        payment.setStatus(PaymentStatus.REJECTED);
        payment.setInstructorNote(request.getInstructorNote());
        var saved = paymentRequestRepository.save(payment);

        var course = courseRepository.findById(saved.getCourseId()).orElseThrow();
        notificationService.createNotification(
                saved.getStudentId(),
                "Thanh toán bị từ chối",
                "Thanh toán cho khóa học '" + course.getTitle() + "' bị từ chối. Lý do: " + request.getInstructorNote(),
                NotificationType.PAYMENT_REJECTED,
                saved.getId()
        );
        return paymentRequestMapper.toResponse(saved);
    }

    @Override
    public List<PaymentRequestResponse> getInstructorPaymentRequests(String instructorId, PaymentStatus status) {
        var payments = paymentRequestRepository.findByInstructorIdAndStatusWithDetails(instructorId, status);
        return paymentRequestMapper.toResponseList(payments);
    }

    @Override
    @Transactional
    public void expireOldPaymentRequests() {
        LocalDateTime now = LocalDateTime.now();
        var expiredPayments = paymentRequestRepository.findByStatusAndExpiredAtBefore(PaymentStatus.PENDING, now);

        expiredPayments.forEach(payment -> {
            if (paymentRequestRepository.expireIfPending(payment.getId()) == 0) {
                return; // Đơn vừa được webhook xác nhận — không ghi đè
            }

            var course = courseRepository.findById(payment.getCourseId()).orElse(null);
            if (course != null) {
                notificationService.createNotification(
                        payment.getStudentId(),
                        "Thanh toán đã hết hạn",
                        "Đơn thanh toán khóa học '" + course.getTitle() + "' đã hết hạn. "
                                + "Nếu bạn đã chuyển khoản, hệ thống vẫn tự động ghi nhận khi tiền về.",
                        NotificationType.PAYMENT_EXPIRED,
                        payment.getId()
                );
            }
        });
    }

    @Override
    public AdminPaymentStatsResponse getAdminPaymentStats() {
        return AdminPaymentStatsResponse.builder()
                .totalRevenue(paymentRequestRepository.calculateTotalGrossRevenue())
                .platformRevenue(paymentRequestRepository.calculateTotalPlatformFee())
                .totalPayments(paymentRequestRepository.countAllPayments())
                .confirmedCount(paymentRequestRepository.countAllByPaymentStatus(PaymentStatus.CONFIRMED))
                .pendingCount(paymentRequestRepository.countAllByPaymentStatus(PaymentStatus.PENDING))
                .rejectedCount(paymentRequestRepository.countAllByPaymentStatus(PaymentStatus.REJECTED))
                .expiredCount(paymentRequestRepository.countAllByPaymentStatus(PaymentStatus.EXPIRED))
                .cancelledCount(paymentRequestRepository.countAllByPaymentStatus(PaymentStatus.CANCELLED))
                .build();
    }
}
