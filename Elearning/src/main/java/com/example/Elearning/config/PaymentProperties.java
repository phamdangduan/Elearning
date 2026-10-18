package com.example.Elearning.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Payment configuration properties.
 * Binds to application.yml: payment.*
 */
@Component
@ConfigurationProperties(prefix = "payment")
@Getter
@Setter
public class PaymentProperties {

    /** Thời hạn thanh toán của một đơn (phút). */
    private int expireMinutes = 15;

    /** Prefix của mã đối soát, phải trùng với cấu hình "Tiền tố mã thanh toán" trên SePay. */
    private String referencePrefix = "EDU";

    private Webhook webhook = new Webhook();
    private Platform platform = new Platform();
    private Wallet wallet = new Wallet();

    @Getter
    @Setter
    public static class Webhook {
        /** API key SePay gửi kèm header "Authorization: Apikey <key>". */
        private String apiKey;
    }

    @Getter
    @Setter
    public static class Platform {
        /** Tỷ lệ hoa hồng sàn giữ lại (0.20 = 20%). */
        private BigDecimal commissionRate = new BigDecimal("0.20");
        private String bankName;
        /** Mã ngân hàng theo chuẩn VietQR, ví dụ "MB", "VCB". */
        private String bankCode;
        private String accountNumber;
        private String accountName;
    }

    @Getter
    @Setter
    public static class Wallet {
        /** Số ngày tạm giữ doanh thu trước khi giảng viên được rút. 0 = cộng thẳng vào số dư khả dụng. */
        private int holdDays = 7;
        /** Số tiền rút tối thiểu (VND). */
        private BigDecimal minWithdrawal = new BigDecimal("50000");
    }
}
