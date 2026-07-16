package com.example.Elearning.specification.helper;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.stream.Collectors;

public class TypeConverter {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    @SuppressWarnings({"unchecked", "rawtypes"})
    public static Object convert(String valueStr, Class<?> targetType) {
        if (valueStr == null) {
            return null;
        }

        if (valueStr.contains(",") && !targetType.equals(String.class)) {
            String[] parts = valueStr.split(",");
            return Arrays.stream(parts)
                    .map(part -> convert(part.trim(), targetType))
                    .collect(Collectors.toList());
        }

        if (targetType.equals(String.class)) {
            return valueStr;
        }
        if (targetType.equals(Integer.class) || targetType.equals(int.class)) {
            return Integer.parseInt(valueStr);
        }
        if (targetType.equals(Long.class) || targetType.equals(long.class)) {
            return Long.parseLong(valueStr);
        }
        if (targetType.equals(Double.class) || targetType.equals(double.class)) {
            return Double.parseDouble(valueStr);
        }
        if (targetType.equals(BigDecimal.class)) {
            return new BigDecimal(valueStr);
        }
        if (targetType.equals(Boolean.class) || targetType.equals(boolean.class)) {
            return Boolean.parseBoolean(valueStr) || "1".equals(valueStr) || "true".equalsIgnoreCase(valueStr);
        }
        if (targetType.equals(LocalDate.class)) {
            return LocalDate.parse(valueStr, DATE_FORMATTER);
        }
        if (targetType.equals(LocalDateTime.class)) {
            return LocalDateTime.parse(valueStr, DATE_TIME_FORMATTER);
        }
        if (targetType.isEnum()) {
            return Enum.valueOf((Class<Enum>) targetType, valueStr.toUpperCase());
        }

        return valueStr;
    }
}
