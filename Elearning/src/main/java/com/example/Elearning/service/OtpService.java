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
    private static final Duration OTP_TTL = Duration.ofMinutes(5);

    /**
     * 1. Sinh ngẫu nhiên 6 chữ số và lưu vào Redis (TTL 5 phút)
     */
    public String generateOtp(String email) {
        SecureRandom random = new SecureRandom();
        String otp = String.valueOf(100000 + random.nextInt(900000));

        String key = OTP_PREFIX + email.toLowerCase().trim();
        redisTemplate.opsForValue().set(key, otp, OTP_TTL);

        log.info("========== [OTP CREATED] Email: {} | OTP: {} | TTL: 5 phút ==========", email, otp);
        return otp;
    }

    /**
     * 2. Kiểm tra mã người dùng nhập có khớp với Redis không
     */
    public boolean validateOtp(String email, String inputOtp) {
        if (inputOtp == null) {
            return false;
        }
        String key = OTP_PREFIX + email.toLowerCase().trim();
        String cachedOtp = redisTemplate.opsForValue().get(key);

        if (cachedOtp == null) {
            return false;
        }

        return cachedOtp.equals(inputOtp.trim());
    }

    /**
     * 3. Xóa mã khỏi Redis ngay sau khi đổi mật khẩu thành công
     */
    public void deleteOtp(String email) {
        String key = OTP_PREFIX + email.toLowerCase().trim();
        redisTemplate.delete(key);
        log.info("========== [OTP DELETED] Đã xóa OTP của email: {} ==========", email);
    }
}
