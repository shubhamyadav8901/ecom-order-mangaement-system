package com.ecommerce.inventory.controller;

import com.ecommerce.inventory.dto.ReservationRequest;
import com.ecommerce.inventory.dto.StockRequest;
import com.ecommerce.inventory.service.InventoryService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/inventory")
@Validated
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @PostMapping("/add")
    public ResponseEntity<Void> addStock(@Valid @RequestBody StockRequest request) {
        inventoryService.addStock(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/set")
    public ResponseEntity<Void> setStock(@Valid @RequestBody StockRequest request) {
        inventoryService.setStock(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reserve")
    public ResponseEntity<Void> reserveStock(@Valid @RequestBody ReservationRequest request) {
        inventoryService.reserveStock(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/confirm/{orderId}")
    public ResponseEntity<Void> confirmReservation(@PathVariable Long orderId) {
        inventoryService.confirmReservation(orderId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/release/{orderId}")
    public ResponseEntity<Void> releaseReservation(@PathVariable Long orderId) {
        inventoryService.releaseReservation(orderId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/batch")
    public ResponseEntity<Map<Long, Integer>> getBatchStock(@RequestBody @NotEmpty List<@Positive Long> productIds) {
        return ResponseEntity.ok(inventoryService.getBatchStock(productIds));
    }
}
