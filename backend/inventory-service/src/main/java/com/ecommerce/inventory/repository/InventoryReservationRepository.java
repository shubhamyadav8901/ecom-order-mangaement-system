package com.ecommerce.inventory.repository;

import com.ecommerce.inventory.domain.InventoryReservation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryReservationRepository extends JpaRepository<InventoryReservation, Long> {
    Optional<InventoryReservation> findByOrderIdAndProductId(Long orderId, Long productId);
    List<InventoryReservation> findByOrderId(Long orderId);
}
