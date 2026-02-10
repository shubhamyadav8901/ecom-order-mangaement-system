#!/usr/bin/env bash
set -euo pipefail

REPORT_DIR="tests/k6/reports"
SUMMARY_JSON="${REPORT_DIR}/saga-summary.json"
REPORT_MD="${REPORT_DIR}/saga-report.md"

mkdir -p "${REPORT_DIR}"

k6 run --summary-export "${SUMMARY_JSON}" tests/k6/saga-flows.js

generated_at="$(date -u '+%Y-%m-%d %H:%M:%S UTC')"
base_url="${BASE_URL:-http://localhost/api}"

http_req_rate="$(jq -r '.metrics.http_reqs.rate // "n/a"' "${SUMMARY_JSON}")"
http_req_p95="$(jq -r '.metrics.http_req_duration["p(95)"] // "n/a"' "${SUMMARY_JSON}")"
http_req_p99="$(jq -r '.metrics.http_req_duration["p(99)"] // "n/a"' "${SUMMARY_JSON}")"
http_failed_rate="$(jq -r '.metrics.http_req_failed.value // "n/a"' "${SUMMARY_JSON}")"

checkout_p95="$(jq -r '.metrics.checkout_flow_duration["p(95)"] // "n/a"' "${SUMMARY_JSON}")"
cancel_p95="$(jq -r '.metrics.cancel_flow_duration["p(95)"] // "n/a"' "${SUMMARY_JSON}")"
refund_p95="$(jq -r '.metrics.refund_flow_duration["p(95)"] // "n/a"' "${SUMMARY_JSON}")"
flow_errors="$(jq -r '.metrics.saga_flow_errors.count // 0' "${SUMMARY_JSON}")"

cat > "${REPORT_MD}" <<MD
# Saga Performance Report

Generated: ${generated_at}
Base URL: ${base_url}

## Aggregate HTTP Metrics
- Request rate: ${http_req_rate} req/s
- P95 latency: ${http_req_p95} ms
- P99 latency: ${http_req_p99} ms
- Failure rate: ${http_failed_rate}

## Flow-Specific P95 Latency
- Checkout flow: ${checkout_p95} ms
- Cancel flow: ${cancel_p95} ms
- Cancel + refund flow: ${refund_p95} ms

## Functional Error Counters
- Saga flow errors: ${flow_errors}

## Scenarios
- checkout_flow: create order
- cancel_flow: create and cancel order
- refund_flow: create order, initiate payment, cancel and wait for refund transition
MD

echo "Generated ${REPORT_MD}"
echo "Raw summary: ${SUMMARY_JSON}"
