# E-Commerce Order Management System - Resume Points

## 🚀 Architecture & System Design
*   Designed and implemented a **Modular Monolith** architecture for an E-Commerce backend, capable of scaling to microservices, handling **Order Management, Inventory, Products, and Payments**.
*   Built a **Distributed Event-Driven Architecture** using **Kafka** to orchestrate complex Saga patterns for order fulfillment, ensuring consistency across services without distributed transactions (2PC).
*   Engineered **Stateless Authentication** across microservices using centralized **JWT** logic, enabling secure inter-service communication and scalable user session management.
*   Deployed a containerized infrastructure using **Docker Compose**, orchestrating **PostgreSQL** (sharded by service domain), **Kafka**, **Zookeeper**, and **Redis** for a production-like development environment.
*   Implemented an **Nginx API Gateway** to unify frontend-backend communication, handling reverse proxying and solving CORS issues for a multi-service architecture.

## 🛠️ Backend Engineering (Java/Spring Boot)
*   Developed **5+ distinct Spring Boot services** sharing a common core library (`common-lib`), demonstrating mastery of **Maven multi-module** project structures and dependency management.
*   Implemented **Pessimistic Locking** in the Inventory Service (`SELECT ... FOR UPDATE`) to prevent **race conditions** and overselling during high-concurrency stock reservations.
*   Enforced database schema versioning and consistency using **Flyway** migrations for automated schema management across multiple isolated databases.
*   Designed strict **Domain-Driven Design (DDD)** layers (Controller, Service, Repository, Domain) with robust DTO mapping and global exception handling for maintainable code.
*   Secured sensitive endpoints with **Role-Based Access Control (RBAC)**, ensuring only authorized users/admins can perform critical actions like product creation or order cancellation.

## ⚛️ Frontend Development (React)
*   Built two separate **React** applications (**Customer Web** & **Admin Panel**) using **Vite** and **TypeScript**, demonstrating full-stack capability.
*   Implemented secure authentication flows in the frontend, managing **JWT tokens** in local storage and creating reusable API interceptors for authenticated requests.
*   Developed a dynamic **Product Management Dashboard** for admins to manage catalog and inventory in real-time.
*   Created a seamless **Shopping Cart & Checkout** experience for customers, integrating directly with the backend Order Service.

## 📈 Key Technical Skills Demonstrated
*   **Languages:** Java 17, TypeScript, SQL
*   **Frameworks:** Spring Boot 3, Spring Security 6, React, Hibernate/JPA
*   **Infrastructure:** Kafka, Docker, Nginx, PostgreSQL, Redis
*   **Concepts:** Event Sourcing (Saga), Distributed Systems, Microservices, API Gateway, JWT Security, Concurrency Control
