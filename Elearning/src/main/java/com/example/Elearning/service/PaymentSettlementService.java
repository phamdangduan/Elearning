package com.example.Elearning.service;

import com.example.Elearning.config.PaymentProperties;
import com.example.Elearning.entity.Course;
import com.example.Elearning.entity.Enrollment;
import com.example.Elearning.entity.PaymentRequest;
import com.example.Elearning.enums.PaymentStatus;
import com.example.Elearning.event.PaymentConfirmedEvent;
import com.example.Elearning.repository.CourseRepository;
import com.example.Elearning.repository.EnrollmentRepository;
import com.example.Elearning.repository.PaymentRequestRepository;
import com.example.Elearning.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

/**
 * Chốt một đơn thanh toán: CONFIRMED → Enrollment → chia doanh thu 20/80 → cộng ví giảng viên.
 * Dùng chung cho webhook SePay và admin xác nhận thủ công, để ví luôn được cộng theo một logic duy nhất.
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PaymentSettlementService {

    PaymentRequestRepository paymentRequestRepository;
    EnrollmentRepository enrollmentRepository;
    UserRepository userRepository;
    CourseRepository courseRepository;
    CourseEnrollmentService courseEnrollmentService;
    WalletService walletService;
    PaymentProperties paymentProperties;
    ApplicationEventPublisher eventPublisher;

    /** Kết quả chia doanh thu. */
    public record Split(BigDecimal commissionRate, BigDecimal platformFee, BigDecimal instructorEarning) {
    }

    /**
     * Làm tròn phí sàn đến đồng; phần giảng viên = tổng − phí sàn
     * (không nhân 0.8 riêng, để platformFee + instructorEarning luôn bằng đúng amount).
     */
    public static Split split(BigDecimal amount, BigDecimal commissionRate) {
        BigDecimal platformFee = amount.multiply(commissionRate).setScale(0, RoundingMode.HALF_UP);
        return new Split(commissionRate, platformFee, amount.subtract(platformFee));
    }

    /**
     * Yêu cầu caller đã:
     *  - mở transaction và khóa dòng PaymentRequest (SELECT ... FOR UPDATE),
     *  - kiểm tra đơn chưa CONFIRMED và học viên chưa sở hữu khóa học.
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public void settle(PaymentRequest payment, BigDecimal paidAmount, String note) {
        PaymentStatus previousStatus = payment.getStatus();
        Split split = split(payment.getAmount(), paymentProperties.getPlatform().getCommissionRate());

        // 1. Đổi trạng thái đơn (kể cả "hồi sinh" đơn EXPIRED/REJECTED khi tiền vẫn về đủ)
        payment.setStatus(PaymentStatus.CONFIRMED);
        payment.setConfirmedAt(LocalDateTime.now());
        payment.setPaidAmount(paidAmount);
        payment.setCommissionRate(split.commissionRate());
        payment.setPlatformFee(split.platformFee());
        payment.setInstructorEarning(split.instructorEarning());
        if (note != null) {
            payment.setInstructorNote(note);
        }
        paymentRequestRepository.save(payment);

        // 2. Hủy các đơn PENDING khác của cùng học viên cho khóa này (tránh trả tiền 2 lần)
        int cancelled = paymentRequestRepository.cancelOtherPending(
                payment.getStudentId(), payment.getCourseId(), payment.getId());

        // 3. Cấp quyền học ngay
        Course course = courseRepository.findById(payment.getCourseId()).orElseThrow();
        Enrollment enrollment = new Enrollment();
        enrollment.setUser(userRepository.findById(payment.getStudentId()).orElseThrow());
        enrollment.setCourse(course);
        enrollment.setPaymentRequestId(payment.getId());
        enrollmentRepository.save(enrollment);

        // 4. Cộng 80% vào ví giảng viên (khóa dòng ví bên trong)
        walletService.creditSale(payment.getInstructorId(), split.instructorEarning(), payment.getId(),
                "Bán khóa học: " + course.getTitle());

        // 5. Cập nhật số lượng học viên của khóa
        courseEnrollmentService.updateCourseEnrollmentCount(payment.getCourseId());

        // 6. Notification chạy @Async sau khi commit
        eventPublisher.publishEvent(new PaymentConfirmedEvent(
                payment.getId(),
                payment.getStudentId(),
                payment.getInstructorId(),
                course.getTitle(),
                payment.getAmount(),
                split.instructorEarning(),
                paymentProperties.getWallet().getHoldDays()
        ));

        log.info("[Settlement] Đơn {} ({}) {} → CONFIRMED. Sàn: {}, GV: {}. Hủy {} đơn PENDING trùng.",
                payment.getReferenceCode(), payment.getId(), previousStatus,
                split.platformFee(), split.instructorEarning(), cancelled);
    }
}
