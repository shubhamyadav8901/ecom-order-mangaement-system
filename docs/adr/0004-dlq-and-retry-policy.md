# ADR 0004: Kafka Retry + Dead-Letter Strategy

- Status: Accepted
- Date: 2026-02-11

## Context
Some failures are transient (network hiccups), while others are permanent (bad payload/schema/type mapping). Treating all errors as retriable creates poison-message loops.

## Decision
Configure `DefaultErrorHandler` with:
- Fixed backoff retries for transient failures.
- Non-retryable classification for permanent failures (serialization/deserialization/type issues, integrity conflicts).
- `DeadLetterPublishingRecoverer` to route unrecoverable records to `<topic>.DLT`.

## Consequences
- Pros:
  - Improves throughput by isolating poison messages.
  - Preserves problematic records for triage/replay.
- Cons:
  - Requires DLT monitoring and operational runbooks.
  - Needs alignment across producer/consumer type mappings.
