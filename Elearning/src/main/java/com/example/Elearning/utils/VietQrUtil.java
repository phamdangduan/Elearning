package com.example.Elearning.utils;

import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Sinh URL ảnh VietQR động (img.vietqr.io) — mã QR chứa sẵn STK, số tiền và nội dung chuyển khoản.
 * Admin quét QR sinh từ dữ liệu text (bankName + accountNumber) an toàn hơn quét ảnh QR do người dùng tự upload,
 * vì ảnh upload có thể trỏ tới một tài khoản khác với STK hiển thị.
 */
@NoArgsConstructor(access = AccessLevel.PRIVATE)
public final class VietQrUtil {

    /** Từ khóa (đã chuẩn hóa: chữ thường, bỏ dấu, bỏ ký tự đặc biệt) → mã ngân hàng VietQR. */
    private static final Map<String, String> BANK_CODES = new LinkedHashMap<>();

    static {
        BANK_CODES.put("vietcombank", "VCB");
        BANK_CODES.put("vcb", "VCB");
        BANK_CODES.put("ngoaithuong", "VCB");
        BANK_CODES.put("vietinbank", "ICB");
        BANK_CODES.put("congthuong", "ICB");
        BANK_CODES.put("techcombank", "TCB");
        BANK_CODES.put("kythuong", "TCB");
        BANK_CODES.put("mbbank", "MB");
        BANK_CODES.put("quandoi", "MB");
        BANK_CODES.put("bidv", "BIDV");
        BANK_CODES.put("dautuvaphattrien", "BIDV");
        BANK_CODES.put("agribank", "VBA");
        BANK_CODES.put("nongnghiep", "VBA");
        BANK_CODES.put("sacombank", "STB");
        BANK_CODES.put("tpbank", "TPB");
        BANK_CODES.put("tienphong", "TPB");
        BANK_CODES.put("vpbank", "VPB");
        BANK_CODES.put("hdbank", "HDB");
        BANK_CODES.put("vib", "VIB");
        BANK_CODES.put("shb", "SHB");
        BANK_CODES.put("msb", "MSB");
        BANK_CODES.put("hanghai", "MSB");
        BANK_CODES.put("ocb", "OCB");
        BANK_CODES.put("seabank", "SEAB");
        BANK_CODES.put("acb", "ACB");
        BANK_CODES.put("achau", "ACB");
    }

    /** Đoán mã VietQR từ tên ngân hàng nhập tự do; trả null nếu không nhận diện được. */
    public static String resolveBankCode(String bankName) {
        if (bankName == null || bankName.isBlank()) {
            return null;
        }
        String normalized = Normalizer.normalize(bankName, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace('đ', 'd').replace('Đ', 'D')
                .toLowerCase()
                .replaceAll("[^a-z0-9]", "");
        if (normalized.equals("mb")) {
            return "MB";
        }
        for (Map.Entry<String, String> entry : BANK_CODES.entrySet()) {
            if (normalized.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return null;
    }

    /**
     * @return URL ảnh QR, hoặc null nếu thiếu mã ngân hàng / số tài khoản.
     */
    public static String buildQrUrl(String bankCode, String accountNumber, String accountName,
                                    BigDecimal amount, String addInfo) {
        if (bankCode == null || accountNumber == null || accountNumber.isBlank()) {
            return null;
        }
        StringBuilder url = new StringBuilder("https://img.vietqr.io/image/")
                .append(encode(bankCode)).append('-').append(encode(accountNumber.trim()))
                .append("-compact2.png?");
        if (amount != null) {
            url.append("amount=").append(amount.setScale(0, java.math.RoundingMode.HALF_UP).toPlainString()).append('&');
        }
        if (addInfo != null) {
            url.append("addInfo=").append(encode(addInfo)).append('&');
        }
        if (accountName != null) {
            url.append("accountName=").append(encode(accountName));
        }
        return url.toString();
    }

    private static String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }
}
