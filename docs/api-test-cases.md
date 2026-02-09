# API Test Cases (Latest)

## Scope
Covers all currently implemented REST APIs across:
- user-service
- product-service
- inventory-service
- order-service
- payment-service

Includes key event-flow verification for the order/inventory/payment saga.

## Preconditions
- PostgreSQL + Kafka + all services are running.
- Flyway migrations are applied.
- Gateway routes `/api/*` correctly.
- Seed users available:
  - admin: `admin@example.com`
  - customer: `user@example.com`

## Token Notation
- `AT_ADMIN`: valid admin JWT
- `AT_CUSTOMER`: valid customer JWT
- `RT_COOKIE`: valid `refresh_token` cookie

---

## 1) user-service

### `POST /auth/register`
- Success: returns `200`, JSON includes `accessToken`, `tokenType`; refresh token set only via cookie.
- Duplicate email: returns `409`.
- Validation failure (invalid email, short password, missing fields): returns `400`.

### `POST /auth/login`
- Success: `200`, access token in body, refresh cookie set.
- Invalid credentials: `401`.
- Validation failure: `400`.

### `POST /auth/refresh-token`
- Success with valid refresh cookie: `200` + new access token.
- Missing refresh cookie: `401`.
- Invalid/expired refresh token: `401`.

### `POST /auth/logout`
- Success: `204`, cookie cleared (`Max-Age=0`).

### `GET /users/me`
- Success with valid token: `200` + current user profile.
- Missing/invalid token: `401`.
- Token user missing in DB: `404`.

### `GET /users/{id}` (admin)
- Admin success: `200`.
- Not found: `404`.
- Non-admin: `403`.

### `POST /users/batch` (admin)
- Success with ids: `200` + list of matched users.
- Empty list: `200` + empty array.
- Non-admin: `403`.

---

## 2) product-service

### Products

#### `GET /products`
- Public success: `200` + list.

#### `GET /products/{id}`
- Public success: `200`.
- Not found: `404`.

#### `POST /products` (admin)
- Success: `200` + created product.
- Invalid category id: `404`.
- Validation failure: `400`.
- Non-admin: `403`.

#### `PUT /products/{id}` (admin)
- Success: `200` + updated product.
- Not found: `404`.
- Invalid category id: `404`.
- Non-admin: `403`.

#### `DELETE /products/{id}` (admin)
- Success: `204`.
- Non-admin: `403`.

### Categories

#### `GET /categories`
- Public success: `200`.

#### `GET /categories/{id}`
- Public success: `200`.
- Not found: `404`.

#### `POST /categories` (admin)
- Success: `200`.
- Validation failure: `400`.
- Non-admin: `403`.

#### `DELETE /categories/{id}` (admin)
- Success: `204`.
- Category with sub-categories/products: `409`.
- Non-admin: `403`.

---

## 3) inventory-service

#### `POST /inventory/add` (admin)
- Success: `200` and stock increment.
- Validation failure: `400`.
- Non-admin: `403`.

#### `POST /inventory/set` (admin)
- Success: `200` and stock set exactly.
- Validation failure: `400`.
- Non-admin: `403`.

#### `POST /inventory/reserve` (admin/internal)
- Success: `200`.
- Insufficient stock: `409`.
- Missing inventory/product: `404`.
- Validation failure: `400`.

#### `POST /inventory/confirm/{orderId}` (admin/internal)
- Success/no-op: `200`.

#### `POST /inventory/release/{orderId}` (admin/internal)
- Success/no-op: `200`.

#### `POST /inventory/batch` (authenticated)
- Success: `200` + stock map for requested product ids.
- Empty request list: `400` (due `@NotEmpty`).
- Unauthenticated: `401`.

---

## 4) order-service

#### `POST /orders`
- Success for authenticated user: `200` with order response.
- Unknown product id: `404`.
- Inactive product: `409`.
- Empty items: `400` (validation) or `400` path-level argument error.
- Missing/invalid token: `401`.

#### `GET /orders/{id}`
- Admin can fetch any: `200`.
- Owner can fetch own: `200`.
- Non-owner customer: `404` (owner-scoped lookup).

#### `GET /orders` (admin)
- Admin success: `200`.
- Non-admin: `403`.

#### `GET /orders/my-orders`
- Authenticated user success: `200`.

#### `GET /orders/user/{userId}` (admin)
- Admin success: `200`.
- Non-admin: `403`.

#### `POST /orders/{id}/cancel`
- Owner/admin cancel unpaid order: `200`, order becomes `CANCELLED`, emits `order-cancelled`.
- Owner/admin cancel paid order: `200`, order becomes `REFUND_PENDING`, emits `order-cancelled` + `refund-requested`.
- Non-owner customer: `403`.
- Already cancelled/delivered/refund pending: conflict-style runtime path (expect non-2xx; currently mapped by global exception handler).

---

## 5) payment-service

#### `POST /payments/initiate` (admin)
- First payment success: `200`, payment status `COMPLETED`.
- Repeated call same `orderId` is idempotent (returns existing completed/refunded payment or updates pending then completes).
- Invalid amount: `400`.
- Non-admin: `403`.

---

## 6) Event Flow and Reliability Tests

### Saga flow (happy path)
1. Place order.
2. Verify outbox `order-created`.
3. Verify inventory reserves and publishes `inventory-reserved`.
4. Verify payment publishes `payment-success`.
5. Verify order transitions to `PAID`.

### Failure and compensation
- Inventory fail path: `inventory-failed` leads order cancellation.
- Payment fail path: `payment-failed` leads order cancellation + inventory release.
- Manual cancel path emits `order-cancelled` and inventory release consumer handles it.

### Refund path
- Cancel `PAID` order -> `REFUND_PENDING` + `refund-requested`.
- `refund-success` -> order `CANCELLED`.
- `refund-failed` -> order `REFUND_FAILED`.

### Outbox
- Pending records are claimed, published, status updated.
- Failed publish marks record `FAILED` with error.
- Stale `IN_PROGRESS` records are reclaimable.
- Max-attempt cap respected.

### Consumer idempotency
- Duplicate event key is ignored using `processed_events` unique key.
- On handler exception, claim is marked failed to allow retry.

---

## 7) Error Contract Checks

For representative 4xx/5xx responses, validate JSON fields:
- `timestamp`
- `status`
- `error`
- `message`
- `path`
