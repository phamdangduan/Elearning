package com.example.Elearning.specification.helper;

import com.example.Elearning.specification.SpecSearchCriteria;
import java.util.regex.Pattern;

public class FilterValidator {

    private static final Pattern KEY_PATTERN = Pattern.compile("^[a-zA-Z0-9_\\.]+$");
    
    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile(
            "(?i)(select|drop|insert|delete|update|union|alter|create|truncate|--|\\bexec\\b|\\bgrant\\b)"
    );

    public static boolean isValid(SpecSearchCriteria criteria) {
        if (criteria == null) {
            return false;
        }

        if (criteria.getKey() == null || !KEY_PATTERN.matcher(criteria.getKey()).matches()) {
            return false;
        }

        if (criteria.getValue() instanceof String) {
            String value = (String) criteria.getValue();
            if (SQL_INJECTION_PATTERN.matcher(value).find()) {
                return false;
            }
        }

        return true;
    }

    public static String sanitizeValue(String value) {
        if (value == null) {
            return null;
        }
        return value.replaceAll("['\";\\-\\-]", "").trim();
    }
}
