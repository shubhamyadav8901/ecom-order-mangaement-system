# DLQ and Retry Runbook

## Overview
Kafka consumers use:
- `ErrorHandlingDeserializer` for safe deserialization error handling
- `DefaultErrorHandler` for retry policy
- `DeadLetterPublishingRecoverer` to route unrecoverable records to `<topic>.DLT`

This behavior is configured in:
- `backend/order-service/src/main/java/com/ecommerce/order/config/KafkaConfig.java`
- `backend/payment-service/src/main/java/com/ecommerce/payment/config/KafkaConfig.java`
- `backend/inventory-service/src/main/java/com/ecommerce/inventory/config/KafkaConfig.java`

## Retry policy
Current defaults:
- Backoff: `1000ms`
- Attempts: `2` retries after first failure
- Non-retryable examples:
  - deserialization/serialization issues
  - data integrity / duplicate-key violations
  - illegal argument payloads

## Dead-letter topic naming
For source topic `X`, dead-letter topic is `X.DLT`.

Examples:
- `order-cancelled` -> `order-cancelled.DLT`
- `inventory-reserved` -> `inventory-reserved.DLT`

## Reprocess command
Use:
```bash
./scripts/kafka-reprocess-dlt.sh <topic> [max_messages]
```

Example:
```bash
./scripts/kafka-reprocess-dlt.sh order-cancelled 50
```

What it does:
- Reads key/value pairs from `<topic>.DLT`
- Re-publishes to `<topic>`
- Uses local Docker Kafka container (`kafka`) and bootstrap `kafka:29092`

## Operational workflow
1. Identify DLT growth via logs/metrics.
2. Inspect problematic records and root-cause payload/schema/config issue.
3. Fix producer/consumer code or config.
4. Reprocess DLT records with `kafka-reprocess-dlt.sh`.
5. Verify consumer lag and business state convergence.

## Safety notes
- Reprocessing can re-trigger side effects if consumer idempotency is missing.
- This project relies on `processed_events` deduplication to suppress duplicate processing.
- Script replays key/value only; headers are not preserved in this basic path.
