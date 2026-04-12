package com.example.Elearning.service.impl;

import com.example.Elearning.dto.request.CategoryRequest;
import com.example.Elearning.dto.response.CategoryResponse;
import com.example.Elearning.dto.response.FileUploadResponse;
import com.example.Elearning.entity.Category;
import com.example.Elearning.exception.AppException;
import com.example.Elearning.exception.ErrorCode;
import com.example.Elearning.mapper.CategoryMapper;
import com.example.Elearning.repository.CategoryRepository;
import com.example.Elearning.service.CategoryService;
import com.example.Elearning.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CategoryServiceImpl implements CategoryService {
    CategoryRepository categoryRepository;
    CategoryMapper categoryMapper;
    FileStorageService fileStorageService;
    @Override
    public List<CategoryResponse> getAllCategories() {
        List<Category> categories = categoryRepository.findAll();
        return categoryMapper.toResponseList(categories);
    }

    @Override
    public CategoryResponse getCategoryById(String id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() ->
                        new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        return categoryMapper.toResponse(category);
    }


    @Override

    public CategoryResponse createCategory(CategoryRequest request, String id , MultipartFile iconFile) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.CATEGORY_EXISTED);
        }

        Category category = categoryMapper.toEntity(request);

        if (iconFile != null && !iconFile.isEmpty()) {
            FileUploadResponse fileResponse = fileStorageService.uploadImage(iconFile, "categories");
            category.setIconUrl(fileResponse.getUrl());
            category.setIconPublicId(fileResponse.getPublicId());
        }

        Category savedCategory = categoryRepository.save(category);
        return categoryMapper.toResponse(savedCategory);
    }



    @Override
    public CategoryResponse updateCategory(String id, CategoryRequest request, MultipartFile iconFile) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        categoryMapper.updateEntity(category, request);

        if (iconFile != null && !iconFile.isEmpty()) {
            if (category.getIconPublicId() != null) {
                fileStorageService.deleteFile(category.getIconPublicId());
            }
            FileUploadResponse fileResponse = fileStorageService.uploadImage(iconFile, "categories");
            category.setIconUrl(fileResponse.getUrl());
            category.setIconPublicId(fileResponse.getPublicId());
        }

        Category updatedCategory = categoryRepository.save(category);
        return categoryMapper.toResponse(updatedCategory);
    }


    @Override
    public Void deleteCategory(String id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new AppException(ErrorCode.CATEGORY_NOT_FOUND));

        if (category.getIconPublicId() != null) {
            fileStorageService.deleteFile(category.getIconPublicId());
        }

        categoryRepository.delete(category);
        return null;
    }


}
