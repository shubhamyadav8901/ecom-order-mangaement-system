# ADR 0002: Transactional Outbox For Event Publication

- Status: Accepted
- Date: 2026-02-11

## Context
Publishing Kafka events directly from request handlers can produce dual-write inconsistencies (DB write succeeds but publish fails, or vice versa).

## Decision
Use a per-service outbox table with scheduled publisher workers:
- Persist domain change + outbox row in one DB transaction.
- Publisher moves records through `PENDING -> IN_PROGRESS -> PUBLISHED/FAILED`.

## Consequences
- Pros:
  - Eliminates dual-write inconsistency between local DB and event stream.
  - Enables replay/recovery for transient publish failures.
- Cons:
  - Additional schema and worker complexity.
  - Requires cleanup strategy for historical outbox records.
