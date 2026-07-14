package com.example.Elearning.repository.specification;

import com.example.Elearning.dto.request.CourseSearchRequest;
import com.example.Elearning.entity.Category;
import com.example.Elearning.entity.Course;
import com.example.Elearning.enums.CourseStatus;
import com.example.Elearning.enums.UserStatus;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;

public class CourseSpecifications {

    public static Specification<Course> hasKeyword(String keyword) {
        return (root, query, criteriaBuilder) -> {
            if (keyword == null || keyword.trim().isEmpty()) {
                return null;
            }
            String pattern = "%" + keyword.trim().toLowerCase() + "%";
            return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("title")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("description")), pattern)
            );
        };
    }

    public static Specification<Course> hasCategory(String categoryId) {
        return (root, query, criteriaBuilder) -> {
            if (categoryId == null || categoryId.trim().isEmpty()) {
                return null;
            }
            Join<Course, Category> categoryJoin = root.join("categories", JoinType.LEFT);
            return criteriaBuilder.equal(categoryJoin.get("id"), categoryId);
        };
    }

    public static Specification<Course> hasPriceBetween(BigDecimal minPrice, BigDecimal maxPrice) {
        return (root, query, criteriaBuilder) -> {
            if (minPrice == null && maxPrice == null) {
                return null;
            }
            if (minPrice != null && maxPrice != null) {
                return criteriaBuilder.between(root.get("price"), minPrice, maxPrice);
            }
            if (minPrice != null) {
                return criteriaBuilder.greaterThanOrEqualTo(root.get("price"), minPrice);
            }
            return criteriaBuilder.lessThanOrEqualTo(root.get("price"), maxPrice);
        };
    }

    public static Specification<Course> hasInstructor(String instructorId) {
        return (root, query, criteriaBuilder) -> {
            if (instructorId == null || instructorId.trim().isEmpty()) {
                return null;
            }
            return criteriaBuilder.equal(root.get("user").get("id"), instructorId);
        };
    }

    public static Specification<Course> hasStatus(CourseStatus status) {
        return (root, query, criteriaBuilder) -> {
            if (status == null) {
                return null;
            }
            return criteriaBuilder.equal(root.get("status"), status);
        };
    }

    public static Specification<Course> hasActiveInstructor() {
        return (root, query, criteriaBuilder) -> {
            return criteriaBuilder.equal(root.get("user").get("status"), UserStatus.ACTIVE);
        };
    }

    public static Specification<Course> buildSpec(CourseSearchRequest request, CourseStatus status, boolean filterActiveInstructor) {
        return (root, query, criteriaBuilder) -> {
            // Apply distinct to avoid duplicate records due to joins (like categories)
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                query.distinct(true);
            }

            Specification<Course> spec = Specification.where(null);

            if (status != null) {
                spec = spec.and(hasStatus(status));
            }
            if (filterActiveInstructor) {
                spec = spec.and(hasActiveInstructor());
            }

            if (request != null) {
                if (request.getKeyword() != null && !request.getKeyword().trim().isEmpty()) {
                    spec = spec.and(hasKeyword(request.getKeyword()));
                }
                if (request.getCategoryId() != null && !request.getCategoryId().trim().isEmpty()) {
                    spec = spec.and(hasCategory(request.getCategoryId()));
                }
                if (request.getMinPrice() != null || request.getMaxPrice() != null) {
                    spec = spec.and(hasPriceBetween(request.getMinPrice(), request.getMaxPrice()));
                }
                if (request.getInstructorId() != null && !request.getInstructorId().trim().isEmpty()) {
                    spec = spec.and(hasInstructor(request.getInstructorId()));
                }
            }

            return spec.toPredicate(root, query, criteriaBuilder);
        };
    }
}
