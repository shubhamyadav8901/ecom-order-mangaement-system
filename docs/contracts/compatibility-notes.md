# Contract Compatibility Notes

## Current topic -> version
- `order-created`: `v1`
- `order-cancelled`: `v1`
- `inventory-reserved`: `v1`
- `inventory-failed`: `v1`
- `payment-success`: `v1`
- `payment-failed`: `v1`
- `refund-requested`: `v1`
- `refund-success`: `v1`
- `refund-failed`: `v1`

## Runtime behavior
- Outbox publishers attach header `event-contract-version=v1`.
- Consumers must ignore unknown fields to allow additive schema changes.
- Consumers must validate required fields before applying side effects.

## Rolling deployment rules
1. Deploy consumer changes first (accept old+new optional fields).
2. Deploy producer changes after consumer compatibility is live.
3. For breaking changes, run dual-publish or topic-version split during transition.
