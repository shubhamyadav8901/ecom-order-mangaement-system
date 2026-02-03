package com.ecommerce.product.service;

import com.ecommerce.common.exception.ResourceNotFoundException;
import com.ecommerce.product.domain.Category;
import com.ecommerce.product.domain.Product;
import com.ecommerce.product.dto.ProductRequest;
import com.ecommerce.product.dto.ProductResponse;
import com.ecommerce.product.repository.CategoryRepository;
import com.ecommerce.product.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
public class ProductService {

    private static final Logger logger = LoggerFactory.getLogger(ProductService.class);

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        Category category = null;
        Long catergoryId = request.categoryId();
        if (catergoryId != null) {
            category = categoryRepository.findById(catergoryId)
                    .orElseThrow(
                            () -> new ResourceNotFoundException("Category not found with id: " + request.categoryId()));
        }

        Product product = Objects.requireNonNull(
                Product.builder()
                        .name(request.name())
                        .description(request.description())
                        .price(request.price())
                        .sellerId(request.sellerId())
                        .status(request.status() != null ? request.status() : "ACTIVE")
                        .category(category)
                        .build());

        Product savedProduct = productRepository.save(product);
        logger.info("Product created with id: {}", savedProduct.getId());
        return mapToResponse(savedProduct);
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getAllProducts() {
        logger.info("Fetching all products");
        return productRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductById(@NonNull Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));
        return mapToResponse(product);
    }

    @Transactional
    public void deleteProduct(@NonNull Long id) {
        productRepository.deleteById(id);
    }

    @Transactional
    public ProductResponse updateProduct(@NonNull Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id: " + id));

        Category category = null;
        if (request.categoryId() != null) {
            category = categoryRepository.findById(request.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.categoryId()));
        }

        product.setName(request.name());
        product.setDescription(request.description());
        product.setPrice(request.price());
        product.setCategory(category);
        if (request.status() != null) {
            product.setStatus(request.status());
        }

        Product savedProduct = productRepository.save(product);
        logger.info("Product updated with id: {}", savedProduct.getId());
        return mapToResponse(savedProduct);
    }

    private ProductResponse mapToResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getCategory() != null ? product.getCategory().getId() : null,
                product.getCategory() != null ? product.getCategory().getName() : null,
                product.getSellerId(),
                product.getStatus(),
                product.getCreatedAt());
    }
}
