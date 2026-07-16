package com.example.Elearning.utils;

import com.example.Elearning.specification.SearchOperation;
import com.example.Elearning.specification.SpecSearchCriteria;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class FilterParser {
    
    private static final Pattern FILTER_PATTERN = Pattern.compile("([a-zA-Z0-9_\\.]+)(>=|<=|[:!><~@#])(.*)");

    public static SpecSearchCriteria parse(String filterString) {
        if (filterString == null || filterString.isEmpty()) {
            return null;
        }

        boolean orPredicate = false;
        if (filterString.startsWith("'")) {
            orPredicate = true;
            filterString = filterString.substring(1);
        }

        Matcher matcher = FILTER_PATTERN.matcher(filterString);
        if (matcher.find()) {
            String key = matcher.group(1);
            String operatorStr = matcher.group(2);
            String value = matcher.group(3);

            SearchOperation operation = SearchOperation.getSimpleOperation(operatorStr);
            if (operation != null) {
                return new SpecSearchCriteria(key, operation, value, orPredicate);
            }
        }
        return null;
    }
}
