package com.example.Elearning.mapper;

import com.example.Elearning.dto.request.CategoryRequest;
import com.example.Elearning.dto.request.CreatedCourseRequest;
import com.example.Elearning.dto.request.UpdateCourseRequest;
import com.example.Elearning.dto.response.CategoryResponse;
import com.example.Elearning.entity.Category;
import com.example.Elearning.entity.Course;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CategoryMapper {

    Category toEntity(CategoryRequest request);

    CategoryResponse toResponse(Category category);

    List<CategoryResponse> toResponseList(List<Category> categories);


    void updateEntity(@MappingTarget Category category, CategoryRequest request);
}
