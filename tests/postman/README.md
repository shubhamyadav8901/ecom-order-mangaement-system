# API Postman/Newman Suite

## Files
- `tests/postman/ecom-api-tests.postman_collection.json`
- `tests/postman/local.postman_environment.json`

## Coverage
- User APIs: register, login, refresh-token, logout, current-user
- Product APIs: categories CRUD path + products CRUD path
- Inventory APIs: add, set, reserve, confirm, release, batch
- Order APIs: create, fetch-by-id, admin list, my-orders, user-orders, cancel
- Payment APIs: initiate payment

## Prerequisites
- All backend services are running and routable from `base_url`.
- Provide `admin_access_token` in environment before admin-only requests.
- Refresh token depends on cookies; Postman app handles this more reliably than CLI.

## Run with Newman
```bash
newman run tests/postman/ecom-api-tests.postman_collection.json \
  -e tests/postman/local.postman_environment.json
```

## Suggested order
1. Run user register/login.
2. Set `admin_access_token` manually (or add admin login request).
3. Run full collection.
