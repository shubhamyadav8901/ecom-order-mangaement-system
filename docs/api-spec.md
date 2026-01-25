# API Specification

This document outlines the REST API endpoints available in the E-Commerce Order Management System.

## Base URL
All API requests are routed through the API Gateway (Nginx).
`http://localhost:80/api`

---

## 1. Authentication Service (`user-service`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register a new user | No |
| `POST` | `/auth/login` | Login and receive a JWT access token | No |
| `POST` | `/auth/refresh` | Refresh an expired access token | No |

---

## 2. Product Service (`product-service`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/products` | List all available products | No |
| `GET` | `/products/{id}` | Get details of a specific product | No |
| `POST` | `/products` | Create a new product | Yes (Admin) |
| `DELETE` | `/products/{id}` | Delete a product | Yes (Admin) |

---

## 3. Order Service (`order-service`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/orders` | Place a new order | Yes (User) |
| `GET` | `/orders` | List all orders (Dashboard) | Yes (Admin) |
| `GET` | `/orders/my-orders` | List orders for the authenticated user | Yes (User) |
| `GET` | `/orders/{id}` | Get details of a specific order | Yes |
| `GET` | `/orders/user/{userId}` | Get all orders for a specific user ID | Yes (Admin) |

---

## 4. Inventory Service (`inventory-service`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/inventory/add` | Add stock to a product | Yes (Admin) |
| `POST` | `/inventory/reserve` | Reserve stock (Internal/Saga) | Yes |
| `POST` | `/inventory/release` | Release stock (Internal/Saga) | Yes |

---

## 5. Payment Service (`payment-service`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/payments/initiate` | Initiate a payment | Yes |
