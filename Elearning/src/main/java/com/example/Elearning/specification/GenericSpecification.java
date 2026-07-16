package com.example.Elearning.specification;

import com.example.Elearning.specification.helper.TypeConverter;
import jakarta.persistence.criteria.*;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

public class GenericSpecification<T> implements Specification<T> {

    private final SpecSearchCriteria criteria;

    public GenericSpecification(SpecSearchCriteria criteria) {
        this.criteria = criteria;
    }

    @Override
    @SuppressWarnings({"unchecked", "rawtypes"})
    public Predicate toPredicate(Root<T> root, CriteriaQuery<?> query, CriteriaBuilder cb) {
        try {
            Path<?> path = getPath(root, criteria.getKey());
            Class<?> type = path.getJavaType();

            Object value = TypeConverter.convert((String) criteria.getValue(), type);

            switch (criteria.getOperation()) {
                case EQUALITY:
                    if (value == null) {
                        return cb.isNull(path);
                    }
                    return cb.equal(path, value);
                case NEGATION:
                    if (value == null) {
                        return cb.isNotNull(path);
                    }
                    return cb.notEqual(path, value);
                case GREATER:
                    return cb.greaterThan((Expression) path, (Comparable) value);
                case GREATER_EQUAL:
                    return cb.greaterThanOrEqualTo((Expression) path, (Comparable) value);
                case LESS:
                    return cb.lessThan((Expression) path, (Comparable) value);
                case LESS_EQUAL:
                    return cb.lessThanOrEqualTo((Expression) path, (Comparable) value);
                case LIKE:
                    return cb.like(cb.lower((Expression<String>) path), "%" + ((String) value).toLowerCase() + "%");
                case STARTS_WITH:
                    return cb.like(cb.lower((Expression<String>) path), ((String) value).toLowerCase() + "%");
                case ENDS_WITH:
                    return cb.like(cb.lower((Expression<String>) path), "%" + ((String) value).toLowerCase());
                case CONTAINS:
                    return cb.like(cb.lower((Expression<String>) path), "%" + ((String) value).toLowerCase() + "%");
                case IN:
                    if (value instanceof List) {
                        return path.in((List<?>) value);
                    }
                    return path.in(value);
                case BETWEEN:
                    if (value instanceof List && ((List<?>) value).size() >= 2) {
                        List<Comparable> range = (List<Comparable>) value;
                        return cb.between((Expression) path, range.get(0), range.get(1));
                    }
                    return null;
                default:
                    return null;
            }
        } catch (Exception e) {
            return null;
        }
    }

    private Path<?> getPath(Root<T> root, String key) {
        if (!key.contains(".")) {
            return root.get(key);
        }
        String[] parts = key.split("\\.");
        Path<?> path = root;
        for (int i = 0; i < parts.length; i++) {
            String part = parts[i];
            if (i < parts.length - 1) {
                path = getOrCreateJoin((From<?, ?>) path, part);
            } else {
                path = path.get(part);
            }
        }
        return path;
    }

    private From<?, ?> getOrCreateJoin(From<?, ?> from, String attribute) {
        for (Join<?, ?> join : from.getJoins()) {
            if (join.getAttribute().getName().equals(attribute)) {
                return join;
            }
        }
        return from.join(attribute, JoinType.LEFT);
    }
}
