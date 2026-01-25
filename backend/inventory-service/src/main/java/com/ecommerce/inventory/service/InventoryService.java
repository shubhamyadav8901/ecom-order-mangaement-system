package com.ecommerce.inventory.service;

import com.ecommerce.common.exception.InsufficientStockException;
import com.ecommerce.common.exception.InventoryNotFoundException;
import com.ecommerce.inventory.domain.Inventory;
import com.ecommerce.inventory.domain.InventoryReservation;
import com.ecommerce.inventory.dto.ReservationRequest;
import com.ecommerce.inventory.dto.StockRequest;
import com.ecommerce.inventory.repository.InventoryRepository;
import com.ecommerce.inventory.repository.InventoryReservationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Objects;

@Service
public class InventoryService {

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private InventoryReservationRepository reservationRepository;

    @Transactional
    public void addStock(StockRequest request) {
        Inventory inventory = inventoryRepository.findByProductIdLocked(request.productId())
                .orElse(Inventory.builder()
                        .productId(request.productId())
                        .availableStock(0)
                        .reservedStock(0)
                        .build());

        inventory.setAvailableStock(inventory.getAvailableStock() + request.quantity());
        inventoryRepository.save(inventory);
    }

    @Transactional
    public void reserveStock(ReservationRequest request) {
        // Pessimistic Lock to prevent overselling
        Inventory inventory = inventoryRepository.findByProductIdLocked(request.productId())
                .orElseThrow(() -> new InventoryNotFoundException(request.productId()));

        if (inventory.getAvailableStock() < request.quantity()) {
            throw new InsufficientStockException(
                    request.productId(),
                    request.quantity(),
                    inventory.getAvailableStock());
        }

        inventory.setAvailableStock(inventory.getAvailableStock() - request.quantity());
        inventory.setReservedStock(inventory.getReservedStock() + request.quantity());
        inventoryRepository.save(inventory);

        InventoryReservation reservation = Objects.requireNonNull(
                InventoryReservation.builder()
                        .orderId(request.orderId())
                        .productId(request.productId())
                        .quantity(request.quantity())
                        .expiresAt(LocalDateTime.now().plusMinutes(15)) // 15 min reservation
                        .status("RESERVED")
                        .build());

        reservationRepository.save(reservation);
    }

    @Transactional
    public void confirmReservation(Long orderId) {
        reservationRepository.findByOrderId(orderId).forEach(reservation -> {
            if ("RESERVED".equals(reservation.getStatus())) {
                reservation.setStatus("CONFIRMED");
                reservationRepository.save(reservation);

                // Stock is already moved from available to reserved.
                // Confirming just finalizes the reservation state.
                // We might want to decrease reservedStock here if "Confirmed" means "Shipped",
                // but usually "Confirmed" means "Paid" and still holding stock.
                // For this logic: Confirmed means Permanently Reserved (Sold).
                Inventory inventory = inventoryRepository.findByProductIdLocked(reservation.getProductId())
                        .orElseThrow();
                inventory.setReservedStock(inventory.getReservedStock() - reservation.getQuantity());
                // Technically stock is gone now, or we keep tracking 'Sold' stock if needed.
                // Reducing reservedStock implies it leaves the warehouse view we care about.
                // But wait, if we reduce reservedStock, the stock vanishes from DB counts.
                // That is correct for "shipped/sold" items.
                inventoryRepository.save(inventory);
            }
        });
    }

    @Transactional
    public void releaseReservation(Long orderId) {
        reservationRepository.findByOrderId(orderId).forEach(reservation -> {
            if ("RESERVED".equals(reservation.getStatus())) {
                reservation.setStatus("CANCELLED");
                reservationRepository.save(reservation);

                Inventory inventory = inventoryRepository.findByProductIdLocked(reservation.getProductId())
                        .orElseThrow();

                inventory.setAvailableStock(inventory.getAvailableStock() + reservation.getQuantity());
                inventory.setReservedStock(inventory.getReservedStock() - reservation.getQuantity());
                inventoryRepository.save(inventory);
            }
        });
    }

    @Transactional
    public void reserveOrderItems(Long orderId, java.util.List<com.ecommerce.inventory.event.OrderItemEvent> items) {
        // Sort items by product ID to prevent deadlocks
        var sortedItems = new java.util.ArrayList<>(items);
        sortedItems.sort(java.util.Comparator.comparingLong(com.ecommerce.inventory.event.OrderItemEvent::productId));

        for (var item : sortedItems) {
            reserveStock(new ReservationRequest(orderId, item.productId(), item.quantity()));
        }
    }
}
