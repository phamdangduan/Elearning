package com.example.Elearning.service.impl;

import com.example.Elearning.dto.request.ConfirmPaymentRequest;
import com.example.Elearning.dto.request.CreatePaymentRequest;
import com.example.Elearning.dto.request.RejectPaymentRequest;
import com.example.Elearning.dto.request.UploadPaymentProofRequest;
import com.example.Elearning.dto.response.PaymentInfoResponse;
import com.example.Elearning.dto.response.PaymentRequestDetailResponse;
import com.example.Elearning.dto.response.PaymentRequestResponse;
import com.example.Elearning.entity.Enrollment;
import com.example.Elearning.entity.PaymentRequest;
import com.example.Elearning.enums.NotificationType;
import com.example.Elearning.enums.PaymentStatus;
import com.example.Elearning.exception.AppException;
import com.example.Elearning.exception.ErrorCode;
import com.example.Elearning.mapper.PaymentRequestMapper;
import com.example.Elearning.repository.*;
import com.example.Elearning.service.CourseEnrollmentService;
import com.example.Elearning.service.NotificationService;
import com.example.Elearning.service.PaymentRequestService;
import java.time.Duration;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
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
    BankAccountRepository bankAccountRepository;
    UserRepository userRepository;
    NotificationService notificationService;
    CourseEnrollmentService courseEnrollmentService;


    private String generateReferenceCode(String studentId, String courseId) {
        String studentLast4 = studentId.substring(Math.max(0, studentId.length() - 4));
        String courseLast4 = courseId.substring(Math.max(0, courseId.length() - 4));
        String timestamp = String.valueOf(System.currentTimeMillis()).substring(7);
        return String.format("PAY-%s-%s-%s", studentLast4, courseLast4, timestamp);
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
            paymentRequests = paymentRequestRepository.findAll();
        }

        return paymentRequests.stream()
                .map(paymentRequestMapper::toResponse)
                .collect(Collectors.toList());
    }


    @Override
    public PaymentRequestResponse createPaymentRequest(String studentId, CreatePaymentRequest request) {
        // 1. Validate course exists
        var course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        // 2. Check course price > 0
        if (course.getPrice() == null || course.getPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException(ErrorCode.COURSE_PRICE_ZERO);
        }

        // 3. Check student chưa enroll
        boolean alreadyEnrolled = enrollmentRepository.existsByUserIdAndCourseId(studentId, request.getCourseId());
        if (alreadyEnrolled) {
            throw new AppException(ErrorCode.ALREADY_ENROLLED);
        }

        // 4. Check chưa có payment PENDING
        var existingPayment = paymentRequestRepository
                .findByStudentIdAndCourseIdAndStatus(studentId, request.getCourseId(), PaymentStatus.PENDING);
        if (existingPayment.isPresent()) {
            throw new AppException(ErrorCode.PAYMENT_ALREADY_EXISTS);
        }

        // 5. Get instructor primary bank account
        String instructorId = course.getUser().getId();
        var bankAccount = bankAccountRepository.findByUserIdAndIsPrimaryTrue(instructorId)
                .orElseThrow(() -> new AppException(ErrorCode.PRIMARY_BANK_ACCOUNT_NOT_FOUND));

        // 6. Get student and instructor info
        var student = userRepository.findById(studentId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        var instructor = userRepository.findById(instructorId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // 7. Generate reference code
        String referenceCode = generateReferenceCode(studentId, request.getCourseId());

        // 8. Create payment request
        var paymentRequest = PaymentRequest.builder()
                .studentId(studentId)
                .courseId(request.getCourseId())
                .instructorId(instructorId)
                .instructorBankAccountId(bankAccount.getId())
                .amount(course.getPrice())
                .status(PaymentStatus.PENDING)
                .referenceCode(referenceCode)
                .expiredAt(LocalDateTime.now().plusMinutes(5))
                .build();

        var saved = paymentRequestRepository.save(paymentRequest);

        // 9. Manual mapping response
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
                .paymentProofUrl(saved.getPaymentProofUrl())
                .transferNote(saved.getTransferNote())
                .status(saved.getStatus())
                .studentNote(saved.getStudentNote())
                .instructorNote(saved.getInstructorNote())
                .referenceCode(saved.getReferenceCode())
                .createdAt(saved.getCreatedAt())
                .confirmedAt(saved.getConfirmedAt())
                .expiredAt(saved.getExpiredAt())
                .timeRemainingSeconds(calculateTimeRemaining(saved.getExpiredAt()))
                .build();
    }


    @Override
    public PaymentRequestResponse uploadPaymentProof(String studentId, String paymentRequestId, UploadPaymentProofRequest request) {
        // 1. Validate payment exists
        var payment = paymentRequestRepository.findById(paymentRequestId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_REQUEST_NOT_FOUND));

        // 2. Validate ownership
        if (!payment.getStudentId().equals(studentId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // 3. Check status PENDING
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new AppException(ErrorCode.PAYMENT_NOT_PENDING);
        }

        // 4. Update proof URL and transfer note
        payment.setPaymentProofUrl(request.getPaymentProofUrl());
        payment.setTransferNote(request.getTransferNote());


        var saved = paymentRequestRepository.save(payment);

        // 5. Build response
        var student = userRepository.findById(studentId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        var course = courseRepository.findById(saved.getCourseId())
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));
        var instructor = userRepository.findById(saved.getInstructorId())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));


        // TẠO NOTIFICATION CHO INSTRUCTOR
        var courses = courseRepository.findById(saved.getCourseId()).orElseThrow();
        var students = userRepository.findById(studentId).orElseThrow();

        notificationService.createNotification(
                saved.getInstructorId(),
                "Học viên đã upload bill",
                "Học viên " + students.getUserName() + " đã upload bill cho khóa học '" + courses.getTitle() + "'. Vui lòng kiểm tra!",
                NotificationType.PAYMENT_PROOF_UPLOADED,
                saved.getId()
        );

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
                .paymentProofUrl(saved.getPaymentProofUrl())
                .transferNote(saved.getTransferNote())
                .status(saved.getStatus())
                .studentNote(saved.getStudentNote())
                .instructorNote(saved.getInstructorNote())
                .referenceCode(saved.getReferenceCode())
                .studentNote(request.getStudentNote())
                .createdAt(saved.getCreatedAt())
                .confirmedAt(saved.getConfirmedAt())
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
    public PaymentRequestDetailResponse getPaymentRequestDetail(String paymentRequestId) {
        var payment = paymentRequestRepository.findByIdWithDetails(paymentRequestId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_REQUEST_NOT_FOUND));

        return paymentRequestMapper.toDetailResponse(payment);
    }

    @Override
    public PaymentInfoResponse getPaymentInfoForCourse(String courseId) {
        // 1. Get course
        var course = courseRepository.findById(courseId)
                .orElseThrow(() -> new AppException(ErrorCode.COURSE_NOT_FOUND));

        // 2. Get instructor
        String instructorId = course.getUser().getId();
        var instructor = userRepository.findById(instructorId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        // 3. Get primary bank account
        var bankAccount = bankAccountRepository.findByUserIdAndIsPrimaryTrue(instructorId)
                .orElseThrow(() -> new AppException(ErrorCode.PRIMARY_BANK_ACCOUNT_NOT_FOUND));

        // 4. Build response
        return PaymentInfoResponse.builder()
                .instructorName(instructor.getUserName())
                .bankName(bankAccount.getBankName())
                .accountNumber(bankAccount.getAccountNumber())
                .accountName(bankAccount.getAccountName())
                .qrCodeUrl(bankAccount.getQrCodeUrl())
                .amount(course.getPrice())
                .referenceCode(null) // Chưa có reference code vì chưa tạo payment
                .note("Vui lòng chuyển khoản đúng số tiền và ghi rõ nội dung chuyển khoản")
                .build();
    }

    @Override
    public PaymentRequestResponse confirmPaymentRequest(String instructorId, String paymentRequestId, ConfirmPaymentRequest request) {
        // 1. Validate payment exists
        var payment = paymentRequestRepository.findByIdWithDetails(paymentRequestId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_REQUEST_NOT_FOUND));

        // 2. Validate instructor ownership
        if (!payment.getInstructorId().equals(instructorId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // 3. Check status PENDING
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new AppException(ErrorCode.PAYMENT_NOT_PENDING);
        }

        // 4. Update payment status
        payment.setStatus(PaymentStatus.CONFIRMED);
        payment.setConfirmedAt(LocalDateTime.now());
        if (request.getInstructorNote() != null) {
            payment.setInstructorNote(request.getInstructorNote());
        }

        var savedPayment = paymentRequestRepository.save(payment);

        // 5. Create enrollment
        var enrollment = new Enrollment();
        enrollment.setUser(userRepository.findById(payment.getStudentId()).orElseThrow());
        enrollment.setCourse(courseRepository.findById(payment.getCourseId()).orElseThrow());
        enrollment.setPaymentRequestId(payment.getId());
        enrollmentRepository.save(enrollment);

        // Thêm dòng này - Update enrollment count
        courseEnrollmentService.updateCourseEnrollmentCount(payment.getCourseId());

        // TẠO NOTIFICATION CHO STUDENT
        var course = courseRepository.findById(savedPayment.getCourseId()).orElseThrow();

        notificationService.createNotification(
                savedPayment.getStudentId(),
                "Thanh toán đã được xác nhận",
                "Thanh toán cho khóa học '" + course.getTitle() + "' đã được xác nhận. Bạn có thể bắt đầu học ngay!",
                NotificationType.PAYMENT_CONFIRMED,
                savedPayment.getId()
        );

        // 6. Return response
        return paymentRequestMapper.toResponse(savedPayment);
    }

    @Override
    public PaymentRequestResponse rejectPaymentRequest(String instructorId, String paymentRequestId, RejectPaymentRequest request) {
        // 1. Validate payment exists
        var payment = paymentRequestRepository.findByIdWithDetails(paymentRequestId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_REQUEST_NOT_FOUND));

        // 2. Validate instructor ownership
        if (!payment.getInstructorId().equals(instructorId)) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }

        // 3. Check status PENDING
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new AppException(ErrorCode.PAYMENT_NOT_PENDING);
        }

        // 4. Update payment status (instructorNote is REQUIRED)
        payment.setStatus(PaymentStatus.REJECTED);
        payment.setInstructorNote(request.getInstructorNote());

        var savedPayment = paymentRequestRepository.save(payment);

        var course = courseRepository.findById(savedPayment.getCourseId()).orElseThrow();

        notificationService.createNotification(
                savedPayment.getStudentId(),
                "Thanh toán bị từ chối",
                "Thanh toán cho khóa học '" + course.getTitle() + "' bị từ chối. Lý do: " + request.getInstructorNote(),
                NotificationType.PAYMENT_REJECTED,
                savedPayment.getId()
        );

        // 5. Return response (NO enrollment created)
        return paymentRequestMapper.toResponse(savedPayment);
    }

    @Override
    public List<PaymentRequestResponse> getInstructorPaymentRequests(String instructorId, PaymentStatus status) {
        var payments = paymentRequestRepository.findByInstructorIdAndStatusWithDetails(instructorId, status);
        return paymentRequestMapper.toResponseList(payments);
    }


    @Override
    public void expireOldPaymentRequests() {
        LocalDateTime now = LocalDateTime.now();

        var expiredPayments = paymentRequestRepository
                .findByStatusAndExpiredAtBefore(PaymentStatus.PENDING, now)
                .stream()
                .filter(payment -> payment.getPaymentProofUrl() == null)
                .toList();

        expiredPayments.forEach(payment -> {
            payment.setStatus(PaymentStatus.EXPIRED);
            paymentRequestRepository.save(payment);

            // TẠO NOTIFICATION CHO STUDENT
            var course = courseRepository.findById(payment.getCourseId()).orElse(null);
            if (course != null) {
                notificationService.createNotification(
                        payment.getStudentId(),
                        "Thanh toán đã hết hạn",
                        "Thanh toán cho khóa học '" + course.getTitle() + "' đã hết hạn. Vui lòng tạo yêu cầu mới.",
                        NotificationType.PAYMENT_EXPIRED,
                        payment.getId()
                );
            }
        });

    }



}
