# Failure Scenarios

This document describes expected behavior for common failure modes in the checkout and cancellation sagas.

## 1) Payment Failure

Trigger path:
- `inventory-reserved` consumed by payment-service
- payment-service cannot complete payment
- event `payment-failed` emitted

Expected system behavior:
1. order-service consumes `payment-failed` and sets order status to `CANCELLED` (only from eligible states).
2. inventory-service consumes compensation event and releases any reservation.
3. Deduplication prevents duplicate `payment-failed` from repeating side effects.

## 2) Inventory Failure

Trigger path:
- inventory-service fails to reserve stock for `order-created`
- event `inventory-failed` emitted

Expected system behavior:
1. order-service consumes `inventory-failed` and marks order `CANCELLED`.
2. payment-service is not triggered for failed reservations.
3. Re-delivered inventory failure events are ignored by idempotency key.

## 3) Duplicate Events

Trigger path:
- Kafka redelivery/retry/rebalance delivers same logical event more than once.

Expected system behavior:
1. Consumer attempts to claim `processed_events(event_key)`.
2. Duplicate-key conflict indicates already-processed event.
3. Consumer exits without applying duplicate business transition.

## 4) Poison Message / Deserialization Failure

Trigger path:
- event payload cannot deserialize to expected class/type mapping.

Expected system behavior:
1. `ErrorHandlingDeserializer` captures deserialization failure.
2. `DefaultErrorHandler` retries based on policy.
3. Unrecoverable message is published to `<topic>.DLT`.
4. Operators inspect and reprocess after root cause fix.

## 5) Service Restart During Outbox Publish

Trigger path:
- process crashes after marking outbox row `IN_PROGRESS` but before successful Kafka publish.

Expected system behavior:
1. outbox row remains `IN_PROGRESS` with timestamp.
2. next publisher cycle reclaims stale in-progress rows using timeout.
3. event is retried until published or max attempts reached.
4. consumer idempotency prevents duplicate side effects if publish happened before crash.

## 6) Cancel + Refund Failure

Trigger path:
- paid order cancellation emits `refund-requested`.
- payment-service fails refund and emits `refund-failed`.

Expected system behavior:
1. order-service sets status to `REFUND_FAILED`.
2. inventory was already released via `order-cancelled` compensation path.
3. operator or business flow can retry/refund manually based on policy.

## 7) Reprocessing DLT Records

Trigger path:
- after fixing schema/type/config issue for dead-lettered records.

Operational command:
```bash
./scripts/kafka-reprocess-dlt.sh <topic> [max_messages]
```

Expected result:
- records are replayed from `<topic>.DLT` back to `<topic>` for normal consumption.
