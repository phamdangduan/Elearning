package com.example.Elearning.specification.helper;

import com.example.Elearning.specification.GenericSpecificationBuilder;
import com.example.Elearning.specification.SpecSearchCriteria;
import com.example.Elearning.utils.FilterParser;
import com.example.Elearning.utils.OperationResolver;
import org.springframework.data.jpa.domain.Specification;

import java.util.Set;

public class SpecificationHelper {

    public static <T> Specification<T> buildSpecification(String[] filters) {
        return buildSpecification(filters, null);
    }

    /**
     * @param allowedKeys các thuộc tính được phép lọc; null = không giới hạn.
     *                    Nên luôn truyền vào với API công khai, nếu không client có thể lọc theo
     *                    thuộc tính nhạy cảm (vd user.password~...) để dò dữ liệu.
     */
    public static <T> Specification<T> buildSpecification(String[] filters, Set<String> allowedKeys) {
        if (filters == null || filters.length == 0) {
            return null;
        }

        GenericSpecificationBuilder<T> builder = new GenericSpecificationBuilder<>();

        for (String filter : filters) {
            if (filter == null || filter.trim().isEmpty()) {
                continue;
            }

            SpecSearchCriteria criteria = FilterParser.parse(filter.trim());

            if (criteria != null) {
                if (allowedKeys != null && !allowedKeys.contains(criteria.getKey())) {
                    continue;
                }

                if (criteria.getValue() instanceof String) {
                    criteria.setValue(FilterValidator.sanitizeValue((String) criteria.getValue()));
                }

                criteria = OperationResolver.resolve(criteria);

                if (FilterValidator.isValid(criteria)) {
                    builder.with(criteria);
                }
            }
        }

        return builder.build();
    }
}
