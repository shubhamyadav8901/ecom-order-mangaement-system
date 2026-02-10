# E-Commerce Order Management System - Resume Points

## 🚀 Architecture & System Design
*   Designed and implemented a **microservice-oriented modular monorepo** architecture for an e-commerce platform, with independently runnable services for **Order, Inventory, Product, User, and Payment** domains.
*   Built a **Distributed Event-Driven Architecture** using **Kafka** to orchestrate complex Saga patterns for order fulfillment, ensuring consistency across services without distributed transactions (2PC).
*   Implemented **compensating transactions** for paid-order cancellations by orchestrating a refund flow (`refund-requested` -> `refund-success`/`refund-failed`) between Order and Payment services.
*   Engineered **Stateless Authentication** across microservices using centralized **JWT** logic, enabling secure inter-service communication and scalable user session management.
*   Deployed a containerized infrastructure using **Docker Compose**, orchestrating **PostgreSQL** (database-per-service), **Kafka**, **Zookeeper**, and **Redis** for a production-like development environment.
*   Implemented an **Nginx API Gateway** to unify frontend-backend communication, handling reverse proxying and solving CORS issues for a multi-service architecture.

## 🛠️ Backend Engineering (Java/Spring Boot)
*   Developed **5+ distinct Spring Boot services** sharing a common core library (`common-lib`), demonstrating mastery of **Maven multi-module** project structures and dependency management.
*   Implemented **Pessimistic Locking** in the Inventory Service (`SELECT ... FOR UPDATE`) to prevent **race conditions** and overselling during high-concurrency stock reservations.
*   Built **transactional outbox** publishers and hardened Kafka consumers with **idempotent event deduplication** + duplicate-key conflict handling.
*   Added **DLQ and retry policies** in Kafka listeners (`DefaultErrorHandler` + `DeadLetterPublishingRecoverer`) to improve recovery behavior for poison messages.
*   Enforced database schema versioning and consistency using **Flyway** migrations for automated schema management across multiple isolated databases.
*   Designed strict **Domain-Driven Design (DDD)** layers (Controller, Service, Repository, Domain) with robust DTO mapping and global exception handling for maintainable code.
*   Secured sensitive endpoints with **Role-Based Access Control (RBAC)**, ensuring only authorized users/admins can perform critical actions like product creation or order cancellation.
*   Standardized service observability with **Spring Boot Actuator**, **Prometheus metrics**, and tracing-ready logging context (`traceId`/`spanId`).

## ⚛️ Frontend Development (React)
*   Built two separate **React** applications (**Customer Web** & **Admin Panel**) using **Vite** and **TypeScript**, demonstrating full-stack capability.
*   Implemented secure authentication flows in the frontend using **in-memory access tokens** with **HttpOnly refresh-token cookies**, along with reusable authenticated API interceptors.
*   Developed a dynamic **Product Management Dashboard** for admins to manage catalog, categories, and inventory in real-time.
*   Created a seamless **Shopping Cart & Checkout** experience with category-driven discovery, quantity controls, and order lifecycle visibility.

## 🧪 Quality Engineering
*   Added broad **unit test coverage** for API/controller/service paths across modules, including negative scenarios and edge-case exception handling.
*   Implemented **Testcontainers-based integration tests** for saga behavior (order/inventory/payment) with automatic Docker-aware execution.
*   Validated full backend stability regularly using `mvn -q test` across all services in the multi-module build.

## 📈 Key Technical Skills Demonstrated
*   **Languages:** Java 17, TypeScript, SQL
*   **Frameworks:** Spring Boot 3, Spring Security 6, React, Hibernate/JPA
*   **Infrastructure:** Kafka, Docker, Nginx, PostgreSQL, Redis
*   **Concepts:** Saga Orchestration, Transactional Outbox, Idempotent Consumers, DLQ/Retry, Distributed Systems, Microservices, API Gateway, JWT Security, Concurrency Control, Observability
