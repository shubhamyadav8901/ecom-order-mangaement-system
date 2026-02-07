package com.ecommerce.inventory.controller;

import com.ecommerce.inventory.dto.ReservationRequest;
import com.ecommerce.inventory.dto.StockRequest;
import com.ecommerce.inventory.service.InventoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/inventory")
public class InventoryController {

    @Autowired
    private InventoryService inventoryService;

    @PostMapping("/add")
    public ResponseEntity<Void> addStock(@RequestBody StockRequest request) {
        inventoryService.addStock(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/set")
    public ResponseEntity<Void> setStock(@RequestBody StockRequest request) {
        inventoryService.setStock(request);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/reserve")
    public ResponseEntity<Void> reserveStock(@RequestBody ReservationRequest request) {
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
    public ResponseEntity<java.util.Map<Long, Integer>> getBatchStock(@RequestBody java.util.List<Long> productIds) {
        return ResponseEntity.ok(inventoryService.getBatchStock(productIds));
    }
}
