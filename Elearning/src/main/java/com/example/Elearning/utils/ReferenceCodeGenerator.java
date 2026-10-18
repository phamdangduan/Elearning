package com.example.Elearning.utils;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.security.SecureRandom;

/**
 * Sinh mã đối soát chỉ gồm chữ hoa + số (không dấu '-', '_' ...),
 * vì nhiều ngân hàng tự xóa ký tự đặc biệt trong nội dung chuyển khoản → regex không khớp.
 * Bỏ các ký tự dễ nhầm khi học viên gõ tay: 0/O, 1/I/L.
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class ReferenceCodeGenerator {

    private static final char[] ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789".toCharArray();
    private static final SecureRandom RANDOM = new SecureRandom();

    public static final int RANDOM_LENGTH = 8;

    public static String generate(String prefix) {
        StringBuilder sb = new StringBuilder(prefix.length() + RANDOM_LENGTH);
        sb.append(prefix);
        for (int i = 0; i < RANDOM_LENGTH; i++) {
            sb.append(ALPHABET[RANDOM.nextInt(ALPHABET.length)]);
        }
        return sb.toString();
    }
}
