package com.example.Elearning.specification;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SpecSearchCriteria {
    private String key;
    private SearchOperation operation;
    private Object value;
    private boolean orPredicate;
}
