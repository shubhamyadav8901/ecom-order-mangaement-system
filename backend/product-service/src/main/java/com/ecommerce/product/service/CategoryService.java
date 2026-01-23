package com.ecommerce.product.service;

import com.ecommerce.common.exception.ResourceConflictException;
import com.ecommerce.common.exception.ResourceNotFoundException;
import com.ecommerce.product.domain.Category;
import com.ecommerce.product.dto.CategoryRequest;
import com.ecommerce.product.dto.CategoryResponse;
import com.ecommerce.product.repository.CategoryRepository;
import com.ecommerce.product.repository.ProductRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private ProductRepository productRepository;

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        Category parent = null;
        Long parentId = request.parentId();
        if (parentId != null) {
            parent = categoryRepository.findById(parentId)
                    .orElseThrow(() -> new RuntimeException("Parent category not found"));
        }

        Category category = Objects.requireNonNull(
                Category.builder()
                        .name(request.name())
                        .description(request.description())
                        .parent(parent)
                        .build());

        Category savedCategory = categoryRepository.save(category);
        return mapToResponse(savedCategory);
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        // Return only top-level categories to avoid duplicates, subcategories are
        // nested
        return categoryRepository.findAll().stream()
                .filter(c -> c.getParent() == null)
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(@NonNull Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + id));
        return mapToResponse(category);
    }

    @Transactional
    public void deleteCategory(@NonNull Long id) {
        if (!categoryRepository.existsById(id)) {
            // Idempotent delete → return 204
            return;
        }

        Category category = categoryRepository.getReferenceById(id);

        if (!category.getSubCategories().isEmpty()) {
            throw new ResourceConflictException(
                    "Category cannot be deleted because it has sub-categories");
        }

        if (productRepository.existsProductsByCategoryId(id)) {
            throw new ResourceConflictException(
                    "Category cannot be deleted because it has products");
        }

        categoryRepository.deleteById(id);
    }

    private CategoryResponse mapToResponse(Category category) {
        List<CategoryResponse> subCategories = category.getSubCategories().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getDescription(),
                category.getParent() != null ? category.getParent().getId() : null,
                subCategories);
    }
}
