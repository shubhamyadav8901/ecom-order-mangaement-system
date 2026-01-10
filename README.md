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

* **Modular Monolith (Phase-1)**
* Event-driven internally (Kafka)
* Can be split into microservices later

---

## 🚀 How to Run

### Prerequisites

* Docker
* Docker Compose
* Java 17+ (for Backend)
* Node.js (for Frontend)

### Running with Docker

1.  Clone the repository.
2.  Navigate to the `infra/docker` directory (once populated).
    ```bash
    cd infra/docker
    docker-compose up -d
    ```
    *(Note: Docker configurations are currently in setup phase)*

### Manual Setup (Development)

#### Backend
1.  Navigate to `backend/`.
2.  Build the project:
    ```bash
    ./mvnw clean install
    ```
3.  Run the application.

#### Frontend
1.  Navigate to `frontend/`.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

---

## 📁 Repository Structure

* `backend/`: Java/Spring Boot services
* `frontend/`: React applications (Customer, Admin)
* `infra/`: Infrastructure configuration (Docker, Kafka, Nginx, Terraform)
* `docs/`: Design and Architecture documentation
