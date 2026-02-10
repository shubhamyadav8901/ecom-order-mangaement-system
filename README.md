# E-Commerce Order Management System

**(Enterprise-Grade, Resume-Ready Project)**

## 🎯 Goal

Build a **scalable, secure, production-style e-commerce backend** with a **separate frontend**, capable of handling:

* High concurrency
* Order lifecycle management
* Inventory consistency
* Secure payments
* Event-driven processing

This project demonstrates **real-world backend engineering**, not CRUD.

For detailed architecture and design, see [docs/architecture.md](docs/architecture.md).

---

## 🏗 High-Level Architecture

* **Multi-Service Monorepo**: Services run independently but share one repository for cohesive development and testing.
* **Event-Driven**: Uses **Kafka** for the Order Saga pattern (Order -> Inventory -> Payment).
* **Compensation Flows**: Supports cancellation and refund orchestration (Order -> Payment refund -> Order finalization).
* **Reliability Patterns**: Implements transactional outbox publishing + idempotent event deduplication.
* **API Gateway**: **Nginx** routes traffic to backend services and frontend apps.
* **Frontend**: React + TypeScript (Vite).

---

## ✅ Production Readiness Highlights

* **Saga + Compensation**: Order lifecycle handles success/failure transitions across Inventory and Payment, including refund flows for paid cancellations.
* **Outbox Pattern**: Domain changes and integration events are persisted atomically and published asynchronously to Kafka.
* **Idempotent Consumers**: Duplicate delivery is handled safely using `processed_events` tracking and duplicate-key conflict handling.
* **Kafka Resilience**: Configured retries + Dead Letter Topic (DLT) routing for non-recoverable consumer failures.
* **Observability Baseline**: Added Actuator health/info/prometheus exposure and OpenTelemetry bridge-based tracing hooks.

---

## 🧪 Testing Strategy

* **Service Unit Tests**: Controller/service-level tests for core business paths and edge cases.
* **Refund Flow Coverage**: Tests for paid vs unpaid cancellation behavior and payment refund transitions.
* **Integration Tests**: Added Docker-aware Testcontainers saga/integration tests for order, inventory, and payment services.
* **Performance Smoke Test**: k6 script for login -> catalog -> order -> my-orders flow at `tests/k6/order-flow-smoke.js`.
* **Full Suite Command**:
  ```bash
  cd backend
  mvn -q test
  ```
  This runs all backend module tests. Testcontainers tests auto-skip when Docker is unavailable.

### k6 Smoke Run
```bash
k6 run tests/k6/order-flow-smoke.js
```

---

## 🚀 How to Run (Step-by-Step)

Follow these instructions to run the entire system locally.

### 📋 Prerequisites

Ensure you have the following installed:
*   **Java 17+** (`java -version`)
*   **Maven** (`mvn -version`)
*   **Node.js 18+** (`node -v`)
*   **Docker** & **Docker Compose** (`docker compose version` or `docker-compose -v`)

On macOS, you can install the full toolchain using Homebrew:
```bash
./scripts/setup-macos-brew.sh
```

### 1️⃣ Start Infrastructure

Start the databases (Postgres), Message Broker (Kafka), Cache (Redis), and API Gateway (Nginx).

1.  Open a terminal.
2.  Navigate to the infrastructure folder:
    ```bash
    cd infra/docker
    ```
3.  Start the containers in the background:
    ```bash
    docker compose up -d
    ```
4.  Verify they are running:
    ```bash
    docker ps
    ```
    *You should see containers for postgres, kafka, zookeeper, redis, and nginx.*

### 2️⃣ Build and Run Backend

The backend consists of 5 microservices. You need to build them and then run them.

1.  **Build the Project**:
    Navigate to the `backend` folder and build all modules:
    ```bash
    cd backend
    mvn clean install -DskipTests
    ```

2.  **Run the Services**:
    You need to run each service. It is easiest to open **5 separate terminal tabs/windows**, navigate to `backend`, and run:

    *   **Terminal 1 (User Service - Port 8081)**:
        ```bash
        mvn -pl user-service spring-boot:run
        ```
    *   **Terminal 2 (Product Service - Port 8082)**:
        ```bash
        mvn -pl product-service spring-boot:run
        ```
    *   **Terminal 3 (Inventory Service - Port 8083)**:
        ```bash
        mvn -pl inventory-service spring-boot:run
        ```
    *   **Terminal 4 (Order Service - Port 8084)**:
        ```bash
        mvn -pl order-service spring-boot:run
        ```
    *   **Terminal 5 (Payment Service - Port 8085)**:
        ```bash
        mvn -pl payment-service spring-boot:run
        ```

    *Wait for all services to start up completely.*

### 3️⃣ Run Frontend Applications

The frontend consists of two React applications.

1.  **Customer Web App** (For browsing and buying):
    *   Open a new terminal.
    *   Navigate to the folder:
        ```bash
        cd frontend/customer-web
        ```
    *   Install dependencies:
        ```bash
        npm install
        ```
    *   Start the app:
        ```bash
        npm run dev
        ```
    *   It will run on **http://localhost:5173**.

2.  **Admin Panel** (For managing products and inventory):
    *   Open another terminal.
    *   Navigate to the folder:
        ```bash
        cd frontend/admin-panel
        ```
    *   Install dependencies:
        ```bash
        npm install
        ```
    *   Start the app:
        ```bash
        npm run dev
        ```
    *   It will run on **http://localhost:5174**.

### 4️⃣ Accessing the System

You can access the applications via the **Nginx API Gateway** (Port 80) or directly (Dev Ports).

*   **Customer Web**: [http://localhost](http://localhost) (Proxies to Port 5173)
*   **Admin Panel**: [http://localhost/admin](http://localhost/admin) (Proxies to Port 5174)
*   **Prometheus**: [http://localhost:9090](http://localhost:9090)
*   **Grafana**: [http://localhost:3000](http://localhost:3000) (`admin` / `admin`)

#### 🛠️ API Documentation (Swagger/OpenAPI)
Each service exposes API docs. Access them directly:
*   **User Service**: [http://localhost:8081/swagger-ui/index.html](http://localhost:8081/swagger-ui/index.html)
*   **Product Service**: [http://localhost:8082/swagger-ui/index.html](http://localhost:8082/swagger-ui/index.html)
*   **Inventory Service**: [http://localhost:8083/swagger-ui/index.html](http://localhost:8083/swagger-ui/index.html)
*   **Order Service**: [http://localhost:8084/swagger-ui/index.html](http://localhost:8084/swagger-ui/index.html)
*   **Payment Service**: [http://localhost:8085/swagger-ui/index.html](http://localhost:8085/swagger-ui/index.html)

#### 📊 Observability Endpoints
*   **Prometheus metrics**: `http://localhost:<service-port>/actuator/prometheus`
*   **Health**: `http://localhost:<service-port>/actuator/health`

---

## 🛑 How to Stop

1.  Stop the frontend servers with `Ctrl+C`.
2.  Stop the backend services with `Ctrl+C` in each terminal.
3.  Stop the infrastructure:
    ```bash
    cd infra/docker
    docker compose down
    ```

---

## 📁 Repository Structure

* `backend/`: Java/Spring Boot services (User, Product, Inventory, Order, Payment)
* `frontend/`: React applications (Customer, Admin)
* `infra/`: Infrastructure configuration (Docker Compose, PostgreSQL/Kafka wiring, Nginx)
* `docs/`: Design and Architecture documentation

---

## 💾 Initial Seed Data

The application comes with pre-configured seed data (applied automatically via Flyway migrations on startup).

### Default Users
*   **Admin**: `admin@example.com` / `password`
*   **Customer**: `user@example.com` / `password`

### Pre-Seeded Products
The system initializes with:
*   **Categories**: Electronics, Books, Clothing
*   **Products**: Laptops, Smartphones, Books, etc.
*   **Inventory**: 30-200 units per item.
