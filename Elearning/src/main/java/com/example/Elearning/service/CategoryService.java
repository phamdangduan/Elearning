package com.example.Elearning.service;

import com.example.Elearning.dto.request.CategoryRequest;
import com.example.Elearning.dto.response.CategoryResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface CategoryService {
    List<CategoryResponse> getAllCategories();
    CategoryResponse getCategoryById(String id);
    CategoryResponse createCategory( CategoryRequest request,String id, MultipartFile iconFile);
    CategoryResponse updateCategory(String id, CategoryRequest request,MultipartFile iconFile);
    Void deleteCategory (String id);

}
