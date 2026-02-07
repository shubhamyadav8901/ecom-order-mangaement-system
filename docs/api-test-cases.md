# API Test Cases (Detailed)

## Scope
This document defines detailed functional test cases for all REST APIs implemented under backend services:
- user-service
- product-service
- inventory-service
- order-service
- payment-service

## Global Preconditions
- PostgreSQL, Kafka, and all services are running.
- Flyway migrations are applied.
- API gateway/reverse proxy routes `/api/*` correctly to underlying services.
- Seed users exist (at least one `ROLE_CUSTOMER` and one `ROLE_ADMIN`).
- For secured endpoints, valid JWT access tokens are available.

## Conventions
- `AT_CUSTOMER`: valid customer bearer token.
- `AT_ADMIN`: valid admin bearer token.
- `RT_COOKIE`: valid refresh token cookie (`refresh_token`).
- Sample headers for secured endpoints:
  - `Authorization: Bearer <token>`
  - `Content-Type: application/json`

---

## 1) User Service APIs

### 1.1 `POST /auth/register`

#### TC-AUTH-001 Register success
- Preconditions: email not already present.
- Request body:
```json
{"email":"newuser@example.com","password":"Password123!","firstName":"New","lastName":"User"}
```
- Expected:
  - `200 OK`
  - response contains `accessToken`, `tokenType`
  - response does **not** expose refresh token in JSON
  - `Set-Cookie` includes `refresh_token` (HttpOnly, SameSite=Strict)
  - user persisted with encoded password and role `ROLE_CUSTOMER`

#### TC-AUTH-002 Register duplicate email
- Preconditions: email already exists.
- Expected:
  - `500` (current implementation throws runtime conflict path unless mapped)
  - error payload from global exception handler

#### TC-AUTH-003 Register with missing mandatory fields
- Request body missing `email` or `password`.
- Expected:
  - Current implementation likely `500`/deserialization error (no bean validation annotations)
  - Error response should be returned, no partial user creation.

### 1.2 `POST /auth/login`

#### TC-AUTH-004 Login success
- Preconditions: valid user credentials.
- Request:
```json
{"email":"user@example.com","password":"password"}
```
- Expected:
  - `200 OK`
  - body has `accessToken`, `tokenType`
  - body does not include refresh token
  - `Set-Cookie: refresh_token=...; HttpOnly; SameSite=Strict; Path=/`

#### TC-AUTH-005 Login invalid password
- Expected: `401 Unauthorized` from Spring Security auth flow.

#### TC-AUTH-006 Login unknown user
- Expected: `401 Unauthorized`.

### 1.3 `POST /auth/refresh-token`

#### TC-AUTH-007 Refresh success with valid cookie
- Preconditions: valid `RT_COOKIE` not expired and exists in DB.
- Expected:
  - `200 OK`
  - new `accessToken` in response
  - no refresh token in response body

#### TC-AUTH-008 Missing refresh cookie
- Expected: `401 Unauthorized`, empty body.

#### TC-AUTH-009 Expired refresh token
- Preconditions: token exists but expired.
- Expected:
  - error response
  - token deleted from DB

### 1.4 `POST /auth/logout`

#### TC-AUTH-010 Logout success
- Expected:
  - `204 No Content`
  - `Set-Cookie` clears `refresh_token` with `Max-Age=0`

### 1.5 `GET /users/me`

#### TC-USER-001 Fetch current user success
- Preconditions: valid `AT_CUSTOMER`.
- Expected:
  - `200 OK`
  - response contains id, email, firstName, lastName, role

#### TC-USER-002 Missing access token
- Expected: `401 Unauthorized`.

#### TC-USER-003 Token user not found in DB
- Expected: error response (`500` currently due runtime exception path).

---

## 2) Product Service APIs

### 2.1 `POST /products`

#### TC-PROD-001 Create product success
- Preconditions: valid auth according to service security config.
- Request includes name, description, price, sellerId, status.
- Expected: `200 OK`, response product fields populated.

#### TC-PROD-002 Create product with non-existent categoryId
- Expected: `404 Not Found` with resource-not-found error.

#### TC-PROD-003 Create product invalid payload (null name/price)
- Expected: error response (validation is minimal currently).

### 2.2 `GET /products`

#### TC-PROD-004 List products success
- Expected: `200 OK`, array response.

#### TC-PROD-005 Internal service failure path
- Simulate repository exception.
- Expected: `500 Internal Server Error` (covered by existing controller test).

### 2.3 `GET /products/{id}`

#### TC-PROD-006 Get product by id success
- Expected: `200 OK` with matching product.

#### TC-PROD-007 Product not found
- Expected: `404 Not Found`.

### 2.4 `PUT /products/{id}`

#### TC-PROD-008 Update product success
- Expected: `200 OK` and updated fields.

#### TC-PROD-009 Update non-existent product
- Expected: `404 Not Found`.

#### TC-PROD-010 Update with invalid category
- Expected: `404 Not Found`.

### 2.5 `DELETE /products/{id}`

#### TC-PROD-011 Delete product success
- Expected: `204 No Content`.

#### TC-PROD-012 Delete non-existent product id
- Expected: current behavior likely `204` (repository deleteById may not throw).

---

## 3) Category Service APIs

### 3.1 `POST /categories`

#### TC-CAT-001 Create category success
- Expected: `200 OK`, category returned.

#### TC-CAT-002 Create duplicate category name
- Expected: conflict/error depending on DB constraints.

### 3.2 `GET /categories`

#### TC-CAT-003 List categories success
- Expected: `200 OK`, list.

### 3.3 `GET /categories/{id}`

#### TC-CAT-004 Get category success
- Expected: `200 OK`.

#### TC-CAT-005 Category not found
- Expected: `404 Not Found`.

### 3.4 `DELETE /categories/{id}`

#### TC-CAT-006 Delete category success
- Expected: `204 No Content`.

#### TC-CAT-007 Delete non-existent category
- Expected: service-dependent (`204` or error).

---

## 4) Inventory Service APIs

### 4.1 `POST /inventory/add`

#### TC-INV-001 Add stock to existing product inventory
- Request: `{ "productId": 1, "quantity": 10 }`
- Expected: `200 OK`, available stock increased by 10.

#### TC-INV-002 Add stock creates missing inventory row
- Preconditions: product has no inventory row.
- Expected: row created with quantity.

### 4.2 `POST /inventory/set`

#### TC-INV-003 Set stock success
- Expected: `200 OK`, available stock replaced by requested quantity.

#### TC-INV-004 Set stock on missing inventory creates row
- Expected: row created with exact quantity.

### 4.3 `POST /inventory/reserve`

#### TC-INV-005 Reserve stock success
- Preconditions: available stock >= requested quantity.
- Expected:
  - `200 OK`
  - available decreases
  - reserved increases
  - reservation row inserted with `RESERVED`

#### TC-INV-006 Reserve insufficient stock
- Expected: `409 Conflict`, error code/message for insufficient stock.

#### TC-INV-007 Reserve non-existent inventory
- Expected: `404 Not Found`.

### 4.4 `POST /inventory/confirm/{orderId}`

#### TC-INV-008 Confirm reservation success
- Preconditions: reservation exists in `RESERVED`.
- Expected: reservation status `CONFIRMED`; reserved stock decremented.

#### TC-INV-009 Confirm with no reservations
- Expected: `200 OK` no-op.

### 4.5 `POST /inventory/release/{orderId}`

#### TC-INV-010 Release reservation success
- Preconditions: reservation `RESERVED` exists.
- Expected:
  - status -> `CANCELLED`
  - available stock increased
  - reserved stock decreased

#### TC-INV-011 Release already confirmed reservation
- Expected: `200 OK` no stock change.

### 4.6 `POST /inventory/batch`

#### TC-INV-012 Batch stock lookup success
- Request: `[1,2,3]`
- Expected: `200 OK`, map `{ productId: availableStock }` for existing rows.

#### TC-INV-013 Batch lookup empty list
- Expected: `200 OK`, `{}`.

---

## 5) Order Service APIs

### 5.1 `POST /orders`

#### TC-ORD-001 Create order success (customer)
- Preconditions:
  - valid `AT_CUSTOMER`
  - products exist and active
  - inventory available (for downstream flow)
- Request body includes items.
- Expected:
  - `200 OK`
  - order status `CREATED`
  - **server-side** pricing used (catalog price, not client price)
  - outbox event `order-created` enqueued

#### TC-ORD-002 Create order with tampered client price
- Send low/incorrect price in request.
- Expected: total uses product-service canonical price.

#### TC-ORD-003 Create order with inactive product
- Expected: `409 Conflict`.

#### TC-ORD-004 Create order with unknown product
- Expected: `404 Not Found`.

#### TC-ORD-005 Create order without auth
- Expected: `401 Unauthorized`.

### 5.2 `GET /orders/{id}`

#### TC-ORD-006 Owner fetch own order
- Expected: `200 OK`.

#### TC-ORD-007 Customer fetch another user’s order
- Expected: `404 Not Found` (owner-scoped lookup).

#### TC-ORD-008 Admin fetch any order
- Expected: `200 OK`.

### 5.3 `GET /orders`

#### TC-ORD-009 Admin list all orders
- Expected: `200 OK`.

#### TC-ORD-010 Customer list all orders
- Expected: `403 Forbidden`.

### 5.4 `GET /orders/my-orders`

#### TC-ORD-011 Customer list own orders
- Expected: `200 OK` only own orders.

### 5.5 `GET /orders/user/{userId}`

#### TC-ORD-012 Admin list by user id
- Expected: `200 OK`.

#### TC-ORD-013 Customer attempts list by arbitrary user id
- Expected: `403 Forbidden`.

### 5.6 `POST /orders/{id}/cancel`

#### TC-ORD-014 Owner cancels own cancellable order
- Expected: `200 OK`, status `CANCELLED`, outbox event `order-cancelled` enqueued.

#### TC-ORD-015 Non-owner customer cancel attempt
- Expected: `403 Forbidden`.

#### TC-ORD-016 Cancel already cancelled order
- Expected: error response.

#### TC-ORD-017 Cancel delivered order
- Expected: error response (cannot cancel delivered).

---

## 6) Payment Service APIs

### 6.1 `POST /payments/initiate`

#### TC-PAY-001 Initiate payment success
- Request:
```json
{"orderId": 1001, "amount": 199.99, "paymentMethod":"CREDIT_CARD"}
```
- Expected:
  - `200 OK`
  - payment stored
  - status eventually `COMPLETED` (current simulated flow)

#### TC-PAY-002 Initiate payment invalid amount
- Expected: error response (or `200` if currently unvalidated; flag as validation gap).

#### TC-PAY-003 Initiate payment duplicate/retry same order
- Expected: current behavior likely new payment row each call (idempotency gap at API layer).

---

## 7) Event-Driven and Reliability Test Cases

### 7.1 Outbox (all producing services)

#### TC-OUTBOX-001 Business write + outbox enqueue in same transaction
- Force exception after outbox enqueue but before tx commit.
- Expected: neither business change nor outbox row persisted.

#### TC-OUTBOX-002 Pending rows are published and marked `PUBLISHED`
- Seed outbox rows as `PENDING`, run publisher.
- Expected: Kafka send invoked, row status updated, `published_at` set.

#### TC-OUTBOX-003 Failed publish marks row `FAILED`
- Mock Kafka send failure.
- Expected: status `FAILED`, `attempt_count` increments, `last_error` recorded.

#### TC-OUTBOX-004 Stale `IN_PROGRESS` rows are reclaimed
- Mark row `IN_PROGRESS` with old `updated_at`.
- Expected: row re-claimed and retried.

#### TC-OUTBOX-005 Fresh `IN_PROGRESS` row is skipped
- Expected: not claimed by other worker.

#### TC-OUTBOX-006 Max attempt cap enforced
- `attempt_count >= maxAttempts` should be skipped.

### 7.2 Consumer Idempotency (order/inventory/payment)

#### TC-IDEMP-001 Duplicate event same key processed once
- Replay same event.
- Expected: second processing ignored.

#### TC-IDEMP-002 Processing failure clears claim for retry
- Simulate exception in handler.
- Expected: claim removed (`markFailed`), next delivery re-processes.

#### TC-IDEMP-003 Concurrent duplicate deliveries
- Two consumers race same key.
- Expected: only one succeeds processing due unique claim.

---

## 8) Security Test Cases

#### TC-SEC-001 JWT-protected endpoint without token
- Expected `401`.

#### TC-SEC-002 Invalid JWT signature
- Expected `401`.

#### TC-SEC-003 Expired JWT
- Expected `401`.

#### TC-SEC-004 Role-restricted endpoints with customer token
- `/orders`, `/orders/user/{id}` should return `403`.

#### TC-SEC-005 Refresh cookie flags
- On login/logout verify `Set-Cookie` contains:
  - `HttpOnly`
  - `SameSite=Strict`
  - `Path=/`
  - `Secure` when request is HTTPS or `X-Forwarded-Proto=https`

---

## 9) Contract and Error Response Test Cases

#### TC-ERR-001 Resource not found shape
- Verify fields: `timestamp`, `status`, `error`, `message`, `path`.

#### TC-ERR-002 Access denied shape
- `403` error payload uses global handler format.

#### TC-ERR-003 Unhandled exception shape
- `500` payload uses generic message `An unexpected error occurred`.

---

## 10) Suggested Execution Matrix
- **Smoke**: TC-AUTH-004, TC-USER-001, TC-PROD-004, TC-INV-005, TC-ORD-001, TC-PAY-001.
- **Security regression**: TC-ORD-007, TC-ORD-010, TC-ORD-013, TC-ORD-015, TC-SEC-005.
- **Reliability regression**: TC-OUTBOX-002..006, TC-IDEMP-001..003.
- **Negative regression**: TC-AUTH-005, TC-INV-006, TC-ORD-003, TC-ORD-017.

