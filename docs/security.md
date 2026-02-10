# Security Policy (Latest)

## 1. Authentication

- Stateless JWT auth for API calls.
- Access token is supplied via `Authorization: Bearer <token>`.
- Login/refresh flow uses HttpOnly refresh cookie (`refresh_token`).
- JWT parsing and principal population are handled by shared `JwtAuthenticationFilter` in `common-lib`.

## 2. Roles

- `ROLE_CUSTOMER`
- `ROLE_ADMIN`

`ROLE_CUSTOMER` is default on registration.

## 3. Route Authorization Matrix

Based on current shared `SecurityConfig`:

### Public
- `/auth/**`
- `/actuator/**`
- `/swagger-ui/**`
- `/v3/api-docs/**`
- `/swagger-resources/**`
- `/webjars/**`
- `GET /products/**`
- `GET /categories/**`

### Authenticated (any role)
- `GET /users/me`
- `POST /inventory/batch`
- all other non-overridden routes default to authenticated

### Admin only
- Non-GET `/products/**`
- Non-GET `/categories/**`
- `/users/**` (except `/users/me`)
- `/inventory/**` (except `/inventory/batch`)
- `/payments/**`

### Endpoint-level constraints in controllers
- Order routes are authenticated by security config.
- Additional ownership/admin checks are enforced in `OrderController`/`OrderService` for:
  - `/orders`
  - `/orders/{id}`
  - `/orders/my-orders`
  - `/orders/user/{userId}`
  - `/orders/{id}/cancel`

## 4. Cookie Security

Refresh cookie settings from auth controller:
- `HttpOnly=true`
- `SameSite=Strict`
- `Path=/`
- `Secure=true` when request is HTTPS or `X-Forwarded-Proto=https`
- logout clears cookie with `Max-Age=0`

## 5. Data Security

- Passwords stored as BCrypt hashes.
- Authorization decisions are role-based plus ownership checks for user-scoped order access.
- Input validation uses Jakarta Bean Validation annotations and is mapped to `400` via global exception handler.

## 6. Event/Infra Security Notes

- Service-to-service event traffic flows via Kafka topics.
- Consumer deduplication (`processed_events`) and outbox pattern reduce replay side effects.
- Local/dev setup exposes service ports; production should restrict internal network exposure.

## 7. Secret Management

- Production configs (`application-prod.yml`) consume secrets from environment variables:
  - `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
  - `JWT_SECRET`
  - `KAFKA_BOOTSTRAP_SERVERS`
- Kubernetes baseline manifests include `Secret` template (`infra/k8s/base/secret.template.yaml`) for runtime secret injection.
- Default/local values are for development only and must be rotated in real environments.

## 8. Security Test Coverage

- Role/authorization controller tests exist for admin/customer boundaries (notably in order/user modules).
- Refresh-token lifecycle tests include:
  - valid refresh token path
  - expired refresh token rejection and deletion
  - unknown token rejection

## 9. Dependency Scanning

- CI pull requests run GitHub Dependency Review (`actions/dependency-review-action`) to flag vulnerable dependency changes.
