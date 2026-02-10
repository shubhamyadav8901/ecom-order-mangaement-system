# Saga Performance Report

Generated: 2026-02-10 19:30:47 UTC
Base URL: http://localhost/api

## Aggregate HTTP Metrics
- Request rate: 7.694870599258535 req/s
- P95 latency: 37.0674 ms
- P99 latency: n/a ms
- Failure rate: 0

## Flow-Specific P95 Latency
- Checkout flow: 36 ms
- Cancel flow: 56 ms
- Cancel + refund flow: 5263 ms

## Functional Error Counters
- Saga flow errors: 0

## Scenarios
- checkout_flow: create order
- cancel_flow: create and cancel order
- refund_flow: create order, initiate payment, cancel and wait for refund transition
