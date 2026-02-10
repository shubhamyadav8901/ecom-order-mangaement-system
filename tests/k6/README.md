# k6 Performance Smoke Tests

This folder contains lightweight performance tests for critical API flows.

## Prerequisites
- Backend services running locally (gateway on `http://localhost/api`).
- [k6](https://k6.io/) installed.

### Install k6 with Homebrew (macOS)
```bash
brew install k6
```

## Run
```bash
k6 run tests/k6/order-flow-smoke.js
```

## Optional environment overrides
```bash
BASE_URL=http://localhost/api \
USER_EMAIL=user@example.com \
USER_PASSWORD=password \
VUS=10 \
DURATION=60s \
k6 run tests/k6/order-flow-smoke.js
```

## What it validates
- Auth login and token issuance
- Product listing reachability
- Order creation
- My-orders endpoint availability
- Basic latency/failure thresholds
