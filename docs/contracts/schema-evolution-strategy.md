# Schema Evolution Strategy

## Goals
- Keep event-driven flows stable across independent service deployments.
- Avoid downtime during schema changes.

## Rules
- Non-breaking change examples:
  - Add optional field
  - Add optional metadata/header
- Breaking change examples:
  - Remove or rename required field
  - Change field type incompatibly

## Process
1. Propose schema change and classify as non-breaking/breaking.
2. Update JSON schema under a new version folder when breaking (`v2`).
3. Update producer/consumer compatibility tests.
4. Roll out consumers first, then producers.
5. Monitor DLT for contract failures after rollout.

## Governance artifacts
- Schemas: `docs/contracts/v*/`
- Compatibility notes: `docs/contracts/compatibility-notes.md`
- ADRs: `docs/adr/`
