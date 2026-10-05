package com.example.Elearning.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private final StringRedisTemplate redisTemplate;

    private static final String OTP_PREFIX = "otp:forgot:";
    private static final String ATTEMPTS_PREFIX = "otp:forgot-attempts:";
    private static final String COOLDOWN_PREFIX = "otp:forgot-cooldown:";
    private static final Duration OTP_TTL = Duration.ofMinutes(5);
    // Chống dò OTP: sai quá số lần → hủy mã; phải chờ mới được xin mã mới
    private static final int MAX_ATTEMPTS = 5;
    private static final Duration RESEND_COOLDOWN = Duration.ofSeconds(60);

    private static String normalize(String email) {
        return email.toLowerCase().trim();
    }

    /**
     * 1. Sinh ngẫu nhiên 6 chữ số và lưu vào Redis (TTL 5 phút)
     */
    public String generateOtp(String email) {
        SecureRandom random = new SecureRandom();
        String otp = String.valueOf(100000 + random.nextInt(900000));

        String cleanEmail = normalize(email);
        redisTemplate.opsForValue().set(OTP_PREFIX + cleanEmail, otp, OTP_TTL);
        redisTemplate.delete(ATTEMPTS_PREFIX + cleanEmail);
        redisTemplate.opsForValue().set(COOLDOWN_PREFIX + cleanEmail, "1", RESEND_COOLDOWN);

        log.info("========== [OTP CREATED] Email: {} | OTP: {} | TTL: 5 phút ==========", email, otp);
        return otp;
    }

    /**
     * Còn trong thời gian chờ giữa 2 lần gửi mã
     */
    public boolean isInCooldown(String email) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(COOLDOWN_PREFIX + normalize(email)));
    }

    /**
     * 2. Kiểm tra mã người dùng nhập có khớp với Redis không.
     *    Sai MAX_ATTEMPTS lần → xóa mã, người dùng phải xin mã mới.
     */
    public boolean validateOtp(String email, String inputOtp) {
        if (inputOtp == null) {
            return false;
        }
        String cleanEmail = normalize(email);
        String cachedOtp = redisTemplate.opsForValue().get(OTP_PREFIX + cleanEmail);

        if (cachedOtp == null) {
            return false;
        }

        if (cachedOtp.equals(inputOtp.trim())) {
            return true;
        }

        String attemptsKey = ATTEMPTS_PREFIX + cleanEmail;
        Long attempts = redisTemplate.opsForValue().increment(attemptsKey);
        redisTemplate.expire(attemptsKey, OTP_TTL);
        if (attempts != null && attempts >= MAX_ATTEMPTS) {
            log.warn("========== [OTP LOCKED] Nhập sai {} lần, hủy OTP của email: {} ==========", attempts, email);
            deleteOtp(email);
        }
        return false;
    }

    /**
     * 3. Xóa mã khỏi Redis ngay sau khi đổi mật khẩu thành công
     */
    public void deleteOtp(String email) {
        String cleanEmail = normalize(email);
        redisTemplate.delete(OTP_PREFIX + cleanEmail);
        redisTemplate.delete(ATTEMPTS_PREFIX + cleanEmail);
        log.info("========== [OTP DELETED] Đã xóa OTP của email: {} ==========", email);
    }
}
