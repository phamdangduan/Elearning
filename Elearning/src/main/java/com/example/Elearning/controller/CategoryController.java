package com.example.Elearning.controller;

import com.example.Elearning.dto.ApiResponse;
import com.example.Elearning.dto.PageResponse;
import com.example.Elearning.dto.request.CategoryRequest;
import com.example.Elearning.dto.response.CategoryResponse;
import com.example.Elearning.dto.response.CourseResponse;
import com.example.Elearning.exception.SuccessCode;
import com.example.Elearning.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@RequestMapping("/category")
public class CategoryController {
    private final CategoryService categoryService;
    
    @GetMapping
    ApiResponse<List<CategoryResponse>> getAllCategories(){
        return ApiResponse.ok(categoryService.getAllCategories(), SuccessCode.GET_CATEGORY_SUCCESS);
    }

    @GetMapping("/get")
    public ApiResponse<CategoryResponse> getCategoryById(@RequestParam String id) {
        return ApiResponse.ok(categoryService.getCategoryById(id), SuccessCode.GET_CATEGORY_SUCCESS);
    }

    @PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<CategoryResponse> createCategory(
            @RequestPart("category") @Valid CategoryRequest request,
            @RequestParam String id,
            @RequestPart(value = "icon", required = false) MultipartFile iconFile) {
        return ApiResponse.ok(categoryService.createCategory(request, id, iconFile), SuccessCode.CATEGORY_CREATED);
    }

    @PutMapping(value = "/{id}/update", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    ApiResponse<CategoryResponse> updateCategory(
            @PathVariable String id,
            @RequestPart("category") @Valid CategoryRequest request,
            @RequestPart(value = "icon", required = false) MultipartFile iconFile
    ) {
        return ApiResponse.ok(categoryService.updateCategory(id, request, iconFile), SuccessCode.CATEGORY_UPDATED);
    }

    @DeleteMapping("/{id}")
    ApiResponse<Void> deleteCategory(@PathVariable String id) {
        return ApiResponse.ok(categoryService.deleteCategory(id), SuccessCode.DELETED_CATEGORY);
    }

}
