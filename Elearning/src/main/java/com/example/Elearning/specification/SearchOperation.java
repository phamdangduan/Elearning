package com.example.Elearning.specification;

public enum SearchOperation {
    EQUALITY,
    NEGATION,
    GREATER,
    GREATER_EQUAL,
    LESS,
    LESS_EQUAL,
    LIKE,
    IN,
    BETWEEN,
    STARTS_WITH,
    ENDS_WITH,
    CONTAINS;

    public static final String[] SIMPLE_OPERATION_SET = {
            ":", "!", ">=", "<=", ">", "<", "~", "@", "#"
    };

    public static SearchOperation getSimpleOperation(String operator) {
        switch (operator) {
            case ":":
                return EQUALITY;
            case "!":
                return NEGATION;
            case ">":
                return GREATER;
            case ">=":
                return GREATER_EQUAL;
            case "<":
                return LESS;
            case "<=":
                return LESS_EQUAL;
            case "~":
                return LIKE;
            case "@":
                return IN;
            case "#":
                return BETWEEN;
            default:
                return null;
        }
    }
}
