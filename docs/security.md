# Security Policy

## Authentication Architecture
The system uses **stateless authentication** via **JSON Web Tokens (JWT)**.

1.  **Login**: Users exchange credentials (email/password) for a short-lived `access_token` and a long-lived `refresh_token`.
2.  **Requests**: Clients must send the `access_token` in the `Authorization` header: `Bearer <token>`.
3.  **Verification**: Each service independently validates the JWT signature and expiration using a shared secret key (configured in `common-lib`).

## Authorization (RBAC)
Roles are embedded in the JWT claims and enforced at the endpoint level using Spring Security annotations (`@PreAuthorize`).

| Role | Access Level |
| :--- | :--- |
| **ROLE_USER** | Can browse products, place orders, and view their own order history. |
| **ROLE_ADMIN** | Can create/delete products, view all orders, and manage inventory. |

## Network Security
*   **API Gateway**: Nginx acts as the single entry point (Port 80), proxying requests to internal services (Ports 8081-8085).
*   **Internal Communication**: Services communicate directly or via Kafka. In a production environment, internal ports should not be exposed publicly.
*   **CORS**: Configured to allow requests from the Frontend applications (Customer Web and Admin Panel).

## Public vs. Protected Endpoints
*   **Public**:
    *   `/api/auth/**` (Login, Register)
    *   `/api/products` (GET - View Catalog)
    *   `/swagger-ui/**` (API Documentation)
*   **Protected**:
    *   `/api/orders/**` (Requires Auth)
    *   `/api/products` (POST/DELETE - Requires Admin)
    *   `/api/inventory/**` (Requires Admin)

## Data Security
*   **Passwords**: Hashed using **BCrypt** before storage in `user-service`.
*   **Prices**: (Future Improvement) Order prices must be validated against the backend database rather than trusting the frontend payload.
