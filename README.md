# 🚀 Microservices Backend Test - Order System

This project is a technical test for Backend Developer candidates. It simulates a distributed system using microservices architecture with asynchronous communication via RabbitMQ.

---

## 📋 Services Overview

| Service                | Description                                                   |
| ---------------------- | ------------------------------------------------------------- |
| `order-service`        | Exposes an API to create orders and publishes `order.created` |
| `inventory-service`    | Listens to `order.created`, checks stock, and updates it      |
| `notification-service` | Logs a success message when inventory is updated              |

---

## 🛠 Tech Stack

- Node.js + TypeScript
- NestJS (Advanced Node.js framework)
- RabbitMQ (message broker)
- Docker & Docker Compose
- PostgreSQL (database)
- TypeORM (ORM)

---

## 🚀 Running the Application (via Docker)

### 1. **Prerequisites**

- Docker & Docker Compose installed
- Ports `5672`, `15672` (RabbitMQ), `3001-3003` for services, and `5432` (PostgreSQL) should be free

### 2. **Clone the Repository**

```bash
git clone https://github.com/mohammaddandyputra/order-inventory-management-system.git
cd microservices-order-system
docker-compose up --build -d
docker cp init.sql postgres:/tmp/init.sql
docker exec -it postgres psql -U postgres -d order-inventory-management-system -f /tmp/init.sql
```
