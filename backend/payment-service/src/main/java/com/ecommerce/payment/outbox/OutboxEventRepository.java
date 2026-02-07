package com.ecommerce.payment.outbox;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface OutboxEventRepository extends JpaRepository<OutboxEvent, Long> {

    @Query(value = """
            SELECT *
            FROM outbox_events
            WHERE attempt_count < :maxAttempts
              AND (
                    status IN ('PENDING', 'FAILED')
                    OR (status = 'IN_PROGRESS' AND updated_at < :staleBefore)
                  )
            ORDER BY created_at
            LIMIT :batchSize
            FOR UPDATE SKIP LOCKED
            """, nativeQuery = true)
    List<OutboxEvent> lockNextBatchForPublish(
            @Param("maxAttempts") int maxAttempts,
            @Param("staleBefore") LocalDateTime staleBefore,
            @Param("batchSize") int batchSize);
}
