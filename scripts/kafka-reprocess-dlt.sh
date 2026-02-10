#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'MSG'
Reprocess records from a dead-letter topic back to the source topic using the local Kafka container.

Usage:
  ./scripts/kafka-reprocess-dlt.sh <topic> [max_messages]

Examples:
  ./scripts/kafka-reprocess-dlt.sh order-cancelled
  ./scripts/kafka-reprocess-dlt.sh payment-success 25

Notes:
  - Assumes docker-compose Kafka container name is "kafka".
  - Replays key/value pairs; message headers are not preserved by this simple pipeline.
MSG
}

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

if [[ $# -lt 1 || $# -gt 2 ]]; then
  usage
  exit 1
fi

SOURCE_TOPIC="$1"
DLT_TOPIC="${SOURCE_TOPIC}.DLT"
MAX_MESSAGES="${2:-100}"
KAFKA_CONTAINER="${KAFKA_CONTAINER:-kafka}"
BOOTSTRAP="${KAFKA_BOOTSTRAP:-kafka:29092}"

if ! docker ps --format '{{.Names}}' | grep -q "^${KAFKA_CONTAINER}$"; then
  echo "Kafka container '${KAFKA_CONTAINER}' is not running. Start infra first (infra/docker)."
  exit 1
fi

echo "Reprocessing up to ${MAX_MESSAGES} records from ${DLT_TOPIC} -> ${SOURCE_TOPIC}"

docker exec "${KAFKA_CONTAINER}" bash -lc "
set -euo pipefail
kafka-console-consumer \
  --bootstrap-server '${BOOTSTRAP}' \
  --topic '${DLT_TOPIC}' \
  --from-beginning \
  --max-messages '${MAX_MESSAGES}' \
  --property print.key=true \
  --property key.separator=$'\t' \
| kafka-console-producer \
  --bootstrap-server '${BOOTSTRAP}' \
  --topic '${SOURCE_TOPIC}' \
  --property parse.key=true \
  --property key.separator=$'\t'
"

echo "Reprocess command completed."
