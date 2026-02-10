# Internal API Specification (Latest)

This document covers all current REST APIs in the app, including public, admin, and internal service endpoints.

## Base Routing
- Gateway base: `http://localhost/api`
- Service-local base (dev): each service exposes paths without `/api` prefix.

## Auth Model
- Access token: `Authorization: Bearer <jwt>`
- Refresh token: `refresh_token` HttpOnly cookie
- Roles in token: `ROLE_CUSTOMER`, `ROLE_ADMIN`

---

## 1) user-service

### Authentication APIs

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Register customer user. Returns access token; refresh token is set as cookie. |
| POST | `/auth/login` | Public | Login and issue access token + refresh cookie. |
| POST | `/auth/refresh-token` | Public (requires valid refresh cookie) | Mint new access token from refresh token. |
| POST | `/auth/logout` | Public | Clears refresh cookie. |

### User APIs

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/users/me` | Any authenticated user | Current authenticated user profile. |
| GET | `/users/{id}` | Admin | Fetch user by id. |
| POST | `/users/batch` | Admin | Batch fetch users by ids. Used by admin order view enrichment. |

---

## 2) product-service

### Product APIs

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/products` | Public | List products. |
| GET | `/products/{id}` | Public | Product details by id. |
| POST | `/products` | Admin | Create product. Supports multiple `imageUrls`. |
| PUT | `/products/{id}` | Admin | Update product. |
| DELETE | `/products/{id}` | Admin | Delete product. |

### Category APIs

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/categories` | Public | List category tree (top-level with nested sub-categories). |
| GET | `/categories/{id}` | Public | Category details by id. |
| POST | `/categories` | Admin | Create category. |
| DELETE | `/categories/{id}` | Admin | Delete category (blocked if it has children or products). |

---

## 3) inventory-service

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/inventory/add` | Admin | Increment available stock. |
| POST | `/inventory/set` | Admin | Set available stock to exact value. |
| POST | `/inventory/reserve` | Admin/internal | Reserve stock for an order item. |
| POST | `/inventory/confirm/{orderId}` | Admin/internal | Confirm reservation after payment. |
| POST | `/inventory/release/{orderId}` | Admin/internal | Release reservation (payment failure, inventory failure, cancellation). |
| POST | `/inventory/batch` | Any authenticated user/internal | Batch stock lookup by product ids. |

---

## 4) order-service

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/orders` | Any authenticated user | Create order from items. Uses catalog price/status from product-service. |
| GET | `/orders/{id}` | Auth (owner or admin) | Order details. |
| GET | `/orders` | Admin | List all orders. |
| GET | `/orders/my-orders` | Any authenticated user | List caller's orders. |
| GET | `/orders/user/{userId}` | Admin | List orders for specific user id. |
| POST | `/orders/{id}/cancel` | Auth (owner or admin) | Cancel order. For PAID orders transitions to `REFUND_PENDING` and emits refund request. |

---

## 5) payment-service

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| POST | `/payments/initiate` | Admin | Initiate/complete payment. Idempotent by `orderId`. |

Notes:
- Refund processing is internal/event-driven (`refund-requested` topic), not exposed as REST endpoint.

---

## Event Contract Governance

- Kafka producers attach `event-contract-version` header (current value: `v1`).
- Versioned schemas are stored under `docs/contracts/v1/`.
- Compatibility and evolution rules:
  - `docs/contracts/compatibility-notes.md`
  - `docs/contracts/schema-evolution-strategy.md`

---

## Error Contract

Global error body:
- `timestamp`
- `status`
- `error`
- `message`
- `path`

Common status mappings:
- `400` validation errors
- `401` authentication failures
- `403` access denied
- `404` resource not found
- `409` domain conflicts (duplicate email/category, insufficient stock, etc.)
- `500` unexpected errors
