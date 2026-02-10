# ADR 0001: Saga Orchestration Over Distributed Transactions

- Status: Accepted
- Date: 2026-02-11

## Context
Order placement and cancellation require coordinated state transitions across order, inventory, and payment domains. Services have separate databases, so single ACID transactions across services are not available.

## Decision
Use event-driven Saga choreography via Kafka topics (`order-created`, `inventory-reserved`, `payment-success`, `payment-failed`, `inventory-failed`, `order-cancelled`, refund topics).

## Consequences
- Pros:
  - Preserves service autonomy and database-per-service boundaries.
  - Scales better than 2PC in heterogeneous distributed systems.
  - Clear compensation model for failure/retry paths.
- Cons:
  - Eventual consistency requires explicit status transitions.
  - Requires stronger observability and idempotency handling.
