# ADR 0003: Idempotent Consumers With Processed Event Dedup

- Status: Accepted
- Date: 2026-02-11

## Context
Kafka delivers messages at-least-once. Consumers can receive duplicates during retries/rebalances.

## Decision
Track processing with a `processed_events(event_key UNIQUE)` table:
- Build deterministic event keys (e.g., `payment-success:<orderId>`).
- Insert key at start of processing (`REQUIRES_NEW`).
- Treat duplicate-key conflicts as already-processed and exit without side effects.

## Consequences
- Pros:
  - Prevents duplicate status transitions and duplicate side effects.
  - Keeps consumer semantics deterministic under redelivery.
- Cons:
  - Requires careful event-key design.
  - Adds write overhead on consumer path.
