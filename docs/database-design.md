# Database Design (Latest)

The app uses database-per-service. Each service owns and migrates its schema via Flyway.

## 1) user_db

### `users`
- `id` BIGSERIAL PK
- `email` VARCHAR(255) UNIQUE NOT NULL
- `password` VARCHAR(255) NOT NULL
- `first_name` VARCHAR(100)
- `last_name` VARCHAR(100)
- `role` VARCHAR(50) NOT NULL (`ROLE_ADMIN` / `ROLE_CUSTOMER`)
- `created_at`, `updated_at`

### `refresh_tokens`
- `id` BIGSERIAL PK
- `user_id` BIGINT FK -> `users.id`
- `token` VARCHAR(512) UNIQUE NOT NULL
- `expiry_date` TIMESTAMP NOT NULL
- `created_at` TIMESTAMP

---

## 2) product_db

### `categories`
- `id` BIGSERIAL PK
- `name` VARCHAR(255) NOT NULL
- `parent_id` BIGINT FK -> `categories.id`
- `description` TEXT

### `products`
- `id` BIGSERIAL PK
- `name` VARCHAR(255) NOT NULL
- `description` TEXT
- `price` DECIMAL(19,2) NOT NULL
- `seller_id` BIGINT NOT NULL
- `status` VARCHAR(50) NOT NULL (ex: `ACTIVE`, `INACTIVE`, `DELETED`)
- `category_id` BIGINT FK -> `categories.id`
- `created_at`, `updated_at`

### `product_images`
- `product_id` BIGINT FK -> `products.id` (ON DELETE CASCADE)
- `image_url` TEXT NOT NULL
- index: `idx_product_images_product_id`

---

## 3) inventory_db

### `inventory`
- `id` BIGSERIAL PK
- `product_id` BIGINT UNIQUE NOT NULL
- `available_stock` INTEGER NOT NULL DEFAULT 0
- `reserved_stock` INTEGER NOT NULL DEFAULT 0
- `last_updated` TIMESTAMP

### `inventory_reservations`
- `id` BIGSERIAL PK
- `order_id` BIGINT NOT NULL
- `product_id` BIGINT NOT NULL
- `quantity` INTEGER NOT NULL
- `expires_at` TIMESTAMP NOT NULL
- `status` VARCHAR(50) NOT NULL (`RESERVED`, `CONFIRMED`, `CANCELLED`)
- `created_at` TIMESTAMP

### `processed_events`
- `id` BIGSERIAL PK
- `event_key` VARCHAR(255) UNIQUE NOT NULL
- `processed_at` TIMESTAMP

### `outbox_events`
- `id` BIGSERIAL PK
- `event_key` VARCHAR(255) UNIQUE NOT NULL
- `topic`, `aggregate_key`, `event_type` VARCHAR(255) NOT NULL
- `payload` TEXT NOT NULL
- `status` VARCHAR(50) NOT NULL (`PENDING`, `IN_PROGRESS`, `PUBLISHED`, `FAILED`)
- `attempt_count` INTEGER NOT NULL DEFAULT 0
- `last_error` TEXT
- `created_at`, `updated_at`, `published_at`
- index: `idx_inventory_outbox_status_created_at`

---

## 4) order_db

### `orders`
- `id` BIGSERIAL PK
- `user_id` BIGINT NOT NULL
- `status` VARCHAR(50) NOT NULL
- `total_amount` DECIMAL(19,2) NOT NULL
- `created_at`, `updated_at`

### `order_items`
- `id` BIGSERIAL PK
- `order_id` BIGINT FK -> `orders.id`
- `product_id` BIGINT NOT NULL
- `quantity` INTEGER NOT NULL
- `price` DECIMAL(19,2) NOT NULL

### `processed_events`
- `id` BIGSERIAL PK
- `event_key` VARCHAR(255) UNIQUE NOT NULL
- `processed_at` TIMESTAMP

### `outbox_events`
- `id` BIGSERIAL PK
- `event_key` VARCHAR(255) UNIQUE NOT NULL
- `topic`, `aggregate_key`, `event_type` VARCHAR(255) NOT NULL
- `payload` TEXT NOT NULL
- `status` VARCHAR(50) NOT NULL
- `attempt_count` INTEGER NOT NULL DEFAULT 0
- `last_error` TEXT
- `created_at`, `updated_at`, `published_at`
- index: `idx_order_outbox_status_created_at`

---

## 5) payment_db

### `payments`
- `id` BIGSERIAL PK
- `order_id` BIGINT NOT NULL
- `transaction_id` VARCHAR(255)
- `amount` DECIMAL(19,2) NOT NULL
- `status` VARCHAR(50) NOT NULL (`PENDING`, `COMPLETED`, `FAILED`, `REFUNDED`)
- `payment_method` VARCHAR(50)
- `created_at`, `updated_at`

### `processed_events`
- `id` BIGSERIAL PK
- `event_key` VARCHAR(255) UNIQUE NOT NULL
- `processed_at` TIMESTAMP

### `outbox_events`
- `id` BIGSERIAL PK
- `event_key` VARCHAR(255) UNIQUE NOT NULL
- `topic`, `aggregate_key`, `event_type` VARCHAR(255) NOT NULL
- `payload` TEXT NOT NULL
- `status` VARCHAR(50) NOT NULL
- `attempt_count` INTEGER NOT NULL DEFAULT 0
- `last_error` TEXT
- `created_at`, `updated_at`, `published_at`
- index: `idx_payment_outbox_status_created_at`
