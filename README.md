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

* **Modular Monolith**: Services are separated by modules but share a repo for easier development.
* **Event-Driven**: Uses **Kafka** for the Order Saga pattern (Order -> Inventory -> Payment).
* **API Gateway**: **Nginx** routes traffic to backend services and frontend apps.
* **Frontend**: React + TypeScript (Vite).

---

## 🚀 How to Run (Step-by-Step)

Follow these instructions to run the entire system locally.

### 📋 Prerequisites

Ensure you have the following installed:
*   **Java 17+** (`java -version`)
*   **Maven** (`mvn -version`)
*   **Node.js 18+** (`node -v`)
*   **Docker** & **Docker Compose** (`docker-compose -v`)

### 1️⃣ Start Infrastructure

Start the databases (Postgres), Message Broker (Kafka), Cache (Redis), and API Gateway (Nginx).

1.  Open a terminal.
2.  Navigate to the infrastructure folder:
    ```bash
    cd infra/docker
    ```
3.  Start the containers in the background:
    ```bash
    docker-compose up -d
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

#### 🛠️ API Documentation (Swagger/OpenAPI)
Each service exposes API docs. Access them directly:
*   **User Service**: [http://localhost:8081/swagger-ui/index.html](http://localhost:8081/swagger-ui/index.html)
*   **Product Service**: [http://localhost:8082/swagger-ui/index.html](http://localhost:8082/swagger-ui/index.html)
*   **Inventory Service**: [http://localhost:8083/swagger-ui/index.html](http://localhost:8083/swagger-ui/index.html)
*   **Order Service**: [http://localhost:8084/swagger-ui/index.html](http://localhost:8084/swagger-ui/index.html)
*   **Payment Service**: [http://localhost:8085/swagger-ui/index.html](http://localhost:8085/swagger-ui/index.html)

---

## 🛑 How to Stop

1.  Stop the frontend servers with `Ctrl+C`.
2.  Stop the backend services with `Ctrl+C` in each terminal.
3.  Stop the infrastructure:
    ```bash
    cd infra/docker
    docker-compose down
    ```

---

## 📁 Repository Structure

* `backend/`: Java/Spring Boot services (User, Product, Inventory, Order, Payment)
* `frontend/`: React applications (Customer, Admin)
* `infra/`: Infrastructure configuration (Docker, Kafka, Nginx, Terraform)
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
