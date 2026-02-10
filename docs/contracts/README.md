# Event Contracts

This folder defines versioned event payload contracts for Kafka topics.

## Versioning model
- Current version: `v1`
- Kafka header used by publishers: `event-contract-version`
- Contract source of truth: JSON Schemas in `docs/contracts/v1/*.schema.json`

## Compatibility policy
- Backward compatibility is required for all consumers during rolling deployments.
- Additive changes only within a version (new optional fields).
- Breaking changes require a new versioned schema and topic mapping strategy.

See `compatibility-notes.md` and `schema-evolution-strategy.md`.
