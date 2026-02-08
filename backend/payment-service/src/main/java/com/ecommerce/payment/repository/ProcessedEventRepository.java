package com.ecommerce.payment.repository;

import com.ecommerce.payment.domain.ProcessedEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ProcessedEventRepository extends JpaRepository<ProcessedEvent, Long> {
    @Modifying
    @Query(
            value = "INSERT INTO processed_events (event_key) VALUES (:eventKey) ON CONFLICT (event_key) DO NOTHING",
            nativeQuery = true)
    int insertIgnoreConflict(@Param("eventKey") String eventKey);

    void deleteByEventKey(String eventKey);
}
