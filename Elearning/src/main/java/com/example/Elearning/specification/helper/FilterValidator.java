package com.example.Elearning.specification.helper;

import com.example.Elearning.specification.SpecSearchCriteria;
import java.util.regex.Pattern;

public class FilterValidator {

    // Chỉ cho phép tên thuộc tính dạng a.b.c → không chèn được biểu thức lạ vào truy vấn
    private static final Pattern KEY_PATTERN = Pattern.compile("^[a-zA-Z0-9_\\.]+$");

    // Giá trị KHÔNG cần lọc từ khóa SQL: Specification dùng CriteriaBuilder nên giá trị luôn
    // được bind làm tham số, không ghép vào câu SQL. Lọc theo danh sách đen trước đây còn làm
    // hỏng tìm kiếm hợp lệ (xóa dấu '-' của UUID, chặn tiêu đề chứa "update", "create"...).
    public static boolean isValid(SpecSearchCriteria criteria) {
        if (criteria == null) {
            return false;
        }
        return criteria.getKey() != null && KEY_PATTERN.matcher(criteria.getKey()).matches();
    }

    public static String sanitizeValue(String value) {
        if (value == null) {
            return null;
        }
        return value.trim();
    }
}
