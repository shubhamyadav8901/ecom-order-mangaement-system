package com.ecommerce.order.repository;

import com.ecommerce.order.domain.ProcessedEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProcessedEventRepository extends JpaRepository<ProcessedEvent, Long> {
    void deleteByEventKey(String eventKey);
}
