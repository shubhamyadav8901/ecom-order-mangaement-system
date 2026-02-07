CREATE TABLE outbox_events (
    id BIGSERIAL PRIMARY KEY,
    event_key VARCHAR(255) NOT NULL,
    topic VARCHAR(255) NOT NULL,
    aggregate_key VARCHAR(255) NOT NULL,
    event_type VARCHAR(255) NOT NULL,
    payload TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

CREATE INDEX idx_payment_outbox_status_created_at ON outbox_events(status, created_at);
CREATE UNIQUE INDEX uq_payment_outbox_event_key ON outbox_events(event_key);
