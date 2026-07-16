package com.example.Elearning.specification.helper;

import com.example.Elearning.specification.GenericSpecificationBuilder;
import com.example.Elearning.specification.SpecSearchCriteria;
import com.example.Elearning.utils.FilterParser;
import com.example.Elearning.utils.OperationResolver;
import org.springframework.data.jpa.domain.Specification;

public class SpecificationHelper {

    public static <T> Specification<T> buildSpecification(String[] filters) {
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
