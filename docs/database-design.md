# Database Design

The system uses a **Database-per-Service** pattern. Each microservice manages its own database schema.

## 1. User Database (`user_db`)

### `users`
Stores user credentials and profile information.
- `id` (BIGINT, PK): Unique user identifier
- `email` (VARCHAR, Unique): User email address
- `password` (VARCHAR): Hashed password (BCrypt)
- `roles` (VARCHAR): Comma-separated roles (e.g., "ROLE_USER,ROLE_ADMIN")

### `refresh_tokens`
Stores tokens for refreshing user sessions.
- `id` (BIGINT, PK)
- `token` (VARCHAR, Unique)
- `user_id` (BIGINT, FK)
- `expiry_date` (TIMESTAMP)

---

## 2. Product Database (`product_db`)

### `products`
Stores product catalog information.
- `id` (BIGINT, PK)
- `name` (VARCHAR)
- `description` (TEXT)
- `price` (DECIMAL)
- `status` (VARCHAR): e.g., 'ACTIVE', 'INACTIVE'
- `seller_id` (BIGINT): Reference to the seller (User ID)

---

## 3. Inventory Database (`inventory_db`)

### `inventory`
Tracks current stock levels for products.
- `id` (BIGINT, PK)
- `product_id` (BIGINT, Unique)
- `quantity` (INTEGER): Current available stock

### `inventory_reservations`
Tracks stock reserved during the checkout process before payment confirmation.
- `id` (BIGINT, PK)
- `order_id` (BIGINT)
- `product_id` (BIGINT)
- `quantity` (INTEGER)
- `expiry_time` (TIMESTAMP)

---

## 4. Order Database (`order_db`)

### `orders`
Stores order headers and status.
- `id` (BIGINT, PK)
- `user_id` (BIGINT)
- `total_amount` (DECIMAL)
- `status` (VARCHAR): 'CREATED', 'PAID', 'CANCELLED', etc.
- `created_at` (TIMESTAMP)

### `order_items`
Stores line items for each order.
- `id` (BIGINT, PK)
- `order_id` (BIGINT, FK)
- `product_id` (BIGINT)
- `quantity` (INTEGER)
- `price` (DECIMAL): Price snapshot at time of purchase

---

## 5. Payment Database (`payment_db`)

### `payments`
Tracks payment transactions.
- `id` (BIGINT, PK)
- `order_id` (BIGINT)
- `amount` (DECIMAL)
- `status` (VARCHAR): 'PENDING', 'SUCCESS', 'FAILED'
- `transaction_id` (VARCHAR)
