package com.example.Elearning.controller;

import com.example.Elearning.config.PaymentProperties;
import com.example.Elearning.dto.request.SepayWebhookRequest;
import com.example.Elearning.service.SepayWebhookService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Map;

/**
 * Endpoint nhận webhook từ SePay. Public (không JWT) — xác thực bằng API key trong header.
 *
 * Quy ước phản hồi với SePay:
 *  - 200 {"success": true}  : đã nhận. Kể cả khi giao dịch không khớp đơn / chuyển thiếu — đã ghi log
 *                             để đối soát, KHÔNG để SePay retry vô ích.
 *  - 401                    : sai API key.
 *  - 400                    : payload không đọc được.
 *  - 500                    : lỗi hệ thống (DB...) — SePay sẽ retry, idempotency đảm bảo không xử lý trùng.
 */
@Slf4j
@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
public class PaymentWebhookController {

    private static final String API_KEY_SCHEME = "Apikey ";

    private final SepayWebhookService sepayWebhookService;
    private final PaymentProperties paymentProperties;
    private final ObjectMapper objectMapper;

    @PostMapping("/payment")
    public ResponseEntity<Map<String, Object>> receivePayment(
            @RequestHeader(value = "Authorization", required = false) String authorization,
            @RequestBody String rawBody) {

        if (!isValidApiKey(authorization)) {
            log.warn("[Webhook] Từ chối request sai API key");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", "Invalid API key"));
        }

        SepayWebhookRequest request;
        try {
            request = objectMapper.readValue(rawBody, SepayWebhookRequest.class);
        } catch (Exception e) {
            log.warn("[Webhook] Payload không hợp lệ: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Invalid payload"));
        }
        if (request.getId() == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Missing transaction id"));
        }

        try {
            SepayWebhookService.Result result = sepayWebhookService.handle(request, rawBody);
            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", result.message() != null ? result.message() : "OK"));
        } catch (DataIntegrityViolationException e) {
            // Hai webhook cùng ID giao dịch đến đồng thời: luồng sau vướng UNIQUE key → coi như đã xử lý.
            if (sepayWebhookService.isAlreadyRecorded(request.getId())) {
                log.info("[Webhook] Giao dịch SePay {} đã được luồng khác xử lý", request.getId());
                return ResponseEntity.ok(Map.of("success", true, "message", "Transaction already processed"));
            }
            log.error("[Webhook] Lỗi ràng buộc dữ liệu khi xử lý giao dịch {}", request.getId(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Internal error"));
        } catch (Exception e) {
            log.error("[Webhook] Lỗi xử lý giao dịch SePay {}", request.getId(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("success", false, "message", "Internal error"));
        }
    }

    /** So sánh constant-time để không lộ key qua timing attack. Chưa cấu hình key → từ chối tất cả. */
    private boolean isValidApiKey(String authorization) {
        String expectedKey = paymentProperties.getWebhook().getApiKey();
        if (expectedKey == null || expectedKey.isBlank() || authorization == null) {
            return false;
        }
        if (!authorization.regionMatches(true, 0, API_KEY_SCHEME, 0, API_KEY_SCHEME.length())) {
            return false;
        }
        String provided = authorization.substring(API_KEY_SCHEME.length()).trim();
        return MessageDigest.isEqual(
                provided.getBytes(StandardCharsets.UTF_8),
                expectedKey.getBytes(StandardCharsets.UTF_8));
    }
}
