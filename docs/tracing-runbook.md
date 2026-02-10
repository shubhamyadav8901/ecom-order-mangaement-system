# Tracing Runbook (Request -> Kafka Event Chain)

## What is enabled
- Micrometer tracing bridge (OpenTelemetry)
- OTLP exporter endpoint: `OTEL_EXPORTER_OTLP_ENDPOINT` (default `http://localhost:4318/v1/traces`)
- Kafka observation enabled in order/payment/inventory services:
  - `spring.kafka.listener.observation-enabled=true`
  - `spring.kafka.template.observation-enabled=true`

## Local stack
Run infra:
```bash
cd infra/docker
docker compose up -d
```

Jaeger UI:
- [http://localhost:16686](http://localhost:16686)

## Verify end-to-end trace chain
1. Trigger order creation from API or UI.
2. In Jaeger, search by service `order-service`.
3. Open a recent trace and verify spans include:
   - HTTP server span (`POST /orders`)
   - Kafka producer span (`order-created`)
   - Kafka consumer span in `inventory-service`
   - Kafka producer span in `inventory-service` (`inventory-reserved` or `inventory-failed`)
   - Kafka consumer span in `payment-service` (when reserved)
   - Kafka producer span in `payment-service` (`payment-success` / `payment-failed`)
   - Kafka consumer span back in `order-service`

## Useful correlation fields
- `traceId` and `spanId` are included in log pattern for all services.
- Combine logs + Jaeger spans for production debugging.
