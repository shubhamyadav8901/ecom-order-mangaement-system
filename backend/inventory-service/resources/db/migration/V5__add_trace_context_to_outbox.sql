ALTER TABLE outbox_events
    ADD COLUMN trace_id VARCHAR(32),
    ADD COLUMN parent_span_id VARCHAR(16),
    ADD COLUMN trace_sampled BOOLEAN;
