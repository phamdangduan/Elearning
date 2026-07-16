package com.example.Elearning.utils;

import com.example.Elearning.specification.SearchOperation;
import com.example.Elearning.specification.SpecSearchCriteria;

public class OperationResolver {

    public static SpecSearchCriteria resolve(SpecSearchCriteria criteria) {
        if (criteria == null) {
            return null;
        }

        SearchOperation op = criteria.getOperation();
        Object valObj = criteria.getValue();
        
        if (valObj instanceof String) {
            String value = (String) valObj;
            if (op == SearchOperation.EQUALITY || op == SearchOperation.LIKE) {
                boolean startsWithAsterisk = value.startsWith("*");
                boolean endsWithAsterisk = value.endsWith("*");

                if (startsWithAsterisk && endsWithAsterisk) {
                    criteria.setOperation(SearchOperation.CONTAINS);
                    criteria.setValue(value.substring(1, value.length() - 1));
                } else if (startsWithAsterisk) {
                    criteria.setOperation(SearchOperation.ENDS_WITH);
                    criteria.setValue(value.substring(1));
                } else if (endsWithAsterisk) {
                    criteria.setOperation(SearchOperation.STARTS_WITH);
                    criteria.setValue(value.substring(0, value.length() - 1));
                }
            }
        }
        return criteria;
    }
}
