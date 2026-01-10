# E-Commerce Order Management System - Architecture & Design

## 🎯 Goal

Build a **scalable, secure, production-style e-commerce backend** with a **separate frontend**, capable of handling:

* High concurrency
* Order lifecycle management
* Inventory consistency
* Secure payments
* Event-driven processing

This project demonstrates **real-world backend engineering**, not CRUD.

---

## 🏗 High-Level Architecture

![Image](https://miro.medium.com/0%2AxuHRipbS0io0EYVl.png)

![Image](https://camo.githubusercontent.com/70b68962c28f753b14c4a98e4abeee4413cea665d9d89e0b3d5a1a491b1fae7c/68747470733a2f2f6769746875622d70726f64756374696f6e2d757365722d61737365742d3632313064662e73332e616d617a6f6e6177732e636f6d2f35363333363238332f3235303330353335332d33343637376464332d373462342d346366662d393432652d3431346530353034656661332e706e67)

![Image](https://devcenter0.assets.heroku.com/article-images/1544190561-kafka2.png)

### Architecture Style

* **Modular Monolith (Phase-1)**
* Event-driven internally (Kafka)
* Can be split into microservices later

---

## 🔑 User Roles

| Role     | Permissions                   |
| -------- | ----------------------------- |
| CUSTOMER | Browse products, place orders |
| SELLER   | Manage products & inventory   |
| ADMIN    | Full system access            |

---

## 🧠 Core Backend Requirements

### 1️⃣ User & Auth Service

#### Features
* User registration/login
* JWT authentication
* Role-based authorization
* Refresh tokens

#### Tech
* Spring Security
* BCrypt password hashing
* JWT (Access + Refresh)

#### APIs
```
POST /auth/register
POST /auth/login
POST /auth/refresh
GET  /users/me
```

### 2️⃣ Product Catalog Service

#### Features
* Product CRUD
* Category hierarchy
* Price updates
* Search support

#### Entities
```
Product(id, name, description, price, sellerId, status)
Category(id, name, parentId)
```

#### APIs
```
GET    /products
POST   /products
PUT    /products/{id}
DELETE /products/{id}
```

### 3️⃣ Inventory Service (CRITICAL)

#### Features
* Stock management
* Inventory reservation
* Prevent overselling
* Rollback on failure

#### Core Rules
* Stock must be **reserved** before payment
* Reservation expires after X minutes
* Atomic updates using DB locking

#### APIs
```
POST /inventory/reserve
POST /inventory/release
POST /inventory/confirm
```

### 4️⃣ Order Service (Heart of System)

#### Order Lifecycle
```
CREATED → PAYMENT_PENDING → PAID → SHIPPED → DELIVERED
                  ↓
              CANCELLED
```

#### Entities
```
Order(id, userId, status, totalAmount, createdAt)
OrderItem(id, orderId, productId, quantity, price)
```

#### APIs
```
POST /orders
GET  /orders/{id}
GET  /orders/user/{userId}
POST /orders/{id}/cancel
```

### 5️⃣ Payment Service (Simulated Gateway)

#### Features
* Payment initiation
* Idempotent payment APIs
* Failure handling
* Refund support

#### APIs
```
POST /payments/initiate
POST /payments/confirm
POST /payments/refund
```

---

## 📣 Event-Driven Processing (Kafka)

### Events

| Event              | Producer  | Consumer  |
| ------------------ | --------- | --------- |
| ORDER_CREATED      | Order     | Inventory |
| INVENTORY_RESERVED | Inventory | Payment   |
| PAYMENT_SUCCESS    | Payment   | Order     |
| PAYMENT_FAILED     | Payment   | Inventory |

### Requirements
* Exactly-once processing
* Dead-letter queues
* Idempotent consumers

---

## 🔐 Security Requirements

### Must Have
* JWT validation filter
* Role-based method security
* API rate limiting
* Input validation
* CSRF disabled (API only)

### Optional (Bonus)
* ABAC policies
* Audit logs
* API gateway auth

---

## 📈 Scalability & Performance

### Backend
* Stateless services
* Redis caching (products, inventory)
* DB indexes on hot paths
* Async event processing

### Database
* PostgreSQL
* Read replicas (documented)
* Flyway migrations

### Infra
* Dockerized services
* Horizontal scaling ready
* Nginx reverse proxy

---

## 🧪 Reliability & Consistency

* Saga pattern for order flow
* Compensating transactions
* Retry with exponential backoff
* Idempotency keys

---

## 🎨 Frontend Requirements

### Customer Web App
* Browse products
* Cart
* Checkout
* Order history

### Admin Panel
* Product management
* Inventory monitoring
* Order dashboard

### Frontend Stack
* React
* REST API integration
* JWT auth handling

---

## 🧾 Non-Functional Requirements

* API versioning
* Centralized logging
* Structured error responses
* OpenAPI / Swagger docs
* Unit + integration tests
