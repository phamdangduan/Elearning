package com.example.Elearning.specification;

import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class GenericSpecificationBuilder<T> {

    private final List<SpecSearchCriteria> params;

    public GenericSpecificationBuilder() {
        this.params = new ArrayList<>();
    }

    public final GenericSpecificationBuilder<T> with(SpecSearchCriteria criteria) {
        if (criteria != null) {
            params.add(criteria);
        }
        return this;
    }

    public Specification<T> build() {
        if (params.isEmpty()) {
            return null;
        }

        Specification<T> result = new GenericSpecification<>(params.get(0));

        for (int i = 1; i < params.size(); i++) {
            SpecSearchCriteria criteria = params.get(i);
            GenericSpecification<T> spec = new GenericSpecification<>(criteria);
            
            if (criteria.isOrPredicate()) {
                result = result.or(spec);
            } else {
                result = result.and(spec);
            }
        }

        return result;
    }
}
