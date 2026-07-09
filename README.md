# Distributed Core Ledger Engine

## Preliminary

At some point during my cybersecurity bootcamp, I realized just how many things can go wrong within code—not limited to traditional security vulnerabilities, but rooted deeply in the business logic itself.

For example, how does the system handle two people trying to reserve or check out the exact same product simultaneously? How do we resolve those race conditions? Or how does the application maintain transaction integrity to prevent data tampering? Unlike standard applications where software failures result in nothing more than a minor UI glitch, a failure in fintech can lead to catastrophic financial loss, regulatory penalties, and systemic instability.

Therefore, I decided to embark on a journey to explore these critical challenges. This project will focus on the Core Ledger, often referred to as the System of Record (SoR).

My goal is to deconstruct what happens the exact moment a transaction is initiated, analyzing how the underlying internal mechanisms ensure that data is accurately recorded, properly authorized, and entirely immutable. This project serves as an exploratory deep dive into the operational safeguards designed to protect digital assets.

## Technology Stack

| Technology        | Role in Projects  |
| :---------------- | :---------------- |
| NestJs            | Runtime Framework |
| TypeScript        | Language          |
| Primary Database  | PostgreSQL        |
| Distributed Cache | Redis             |
| Jest & Supertest  | Testing Utilities |

## Key Feature

- **ACID-Compliant Atomic Transfers:** Guarantees mathematical balance integrity using strict PostgreSQL transaction blocks. If any segment of a multi-leg asset transfer fails, the entire operation rolls back—ensuring capital is never artificially duplicated or lost in transit.
- **Deadlock-Proof Concurrency:** Employs a deterministic, lexicographical row-locking algorithm (`SELECT FOR UPDATE`) to safely serialize high-frequency concurrent transactions, preventing cross-locking database freezes under extreme load.
- **Tamper-Evident Hash Chains:** Operates strictly as an append-only ledger. Balances are never blindly overwritten; instead, every transaction is cryptographically linked to the previous state via SHA-256 hashes, creating an unalterable, audit-ready chain of custody.
- **BOLA-Secured Multi-Tenancy:** Supports elastic sub-wallets per user profile (e.g., checking, savings, corporate fee pots) while neutralizing Broken Object Level Authorization (BOLA) threat vectors via hardcoded composite tenant boundaries at the query layer.
- **Distributed Idempotency Shield:** Utilizes a high-speed Redis caching gateway to intercept and instantly neutralize duplicate network payloads (e.g., laggy "multi-click" client submissions) before they can consume database connection threads.

## System Architecture and API Endpoints

> **Data Standard:** To prevent floating-point rounding errors, all amounts are handled as **unsigned 64-bit integers** representing the minor currency unit (e.g., `$250.00` is submitted as `25000`).

#### 1. Provision Asset Wallet

- **Endpoint:** `POST /accounts`
- **Auth:** Bearer Token (JWT)
- **Request Payload:**

  ```json
  {
    "type": "checking",
    "currency": "USD"
  }
  ```

  Response (201 Created):

  ```JSON

  {
  "account_id": "8fa886ef-d758-4061-9c6a-4d2d640b377b"
  }
  ```

#### 2. Initiate Atomic Transfer

- **Endpoint:** POST /transfers
- **Auth:** Bearer Token (JWT) + BOLA ownership validation
- **Headers:** X-Idempotency-Key: <UUID>
- **Request Payload:**

  ```JSON
  {
  "source_account_id": "8fa886ef-d758-4061-9c6a-4d2d640b377b",
  "target_account_id": "c1f10be3-bf2e-4360-be87-57519a3b2a2d",
  "amount": 25000,
  "description": "Supplier Invoice Settlement"
  }
  ```

  Response (200 OK):

  ```JSON
  {
  "transaction_id": "7dc4c243-7bb5-4f33-88fe-51ec1004a4ec"
  }
  ```

## Local Setup & Installation

**Prequisites**: You must have Node.js (v18+) and Docker installed on your machine.

### 1. Clone and Install

```bash
git clone git@github.com:felineeee/core-ledger.git
cd notif-backend
npm install
```

### 2. Environment Configuration

You can simply just copy the `.env.example` to the `.env`
. On project directory:

```
cp .env.example .env
```

Or create and configure the `.env` file in the root directory and `docker-compose.yml` into your liking.

```
APP_ENV=development
HTTP_PORT=8080
DATABASE_URL=postgres://c_log:supersecretpassword@localhost:5432/core_ledger_db_dev?sslmode=disable
REDIS_URL=redis://localhost:6379/0
```

### 3. Initialize the Application

```
npm install
npm run migration:up
```

### 4. Unit and Integration Test

Run all standard specs

```
npm run:test
```

## Future Consideration

### Dual-Phase Transaction Lifecycle (Auth & Capture)

Transitions the ledger from instant processing to a two-step payment flow. It introduces a **Hold (Authorization)** mechanism, granting merchants a configurable time window to either finalize **(Capture)** or cancel **(Void)** funds before final settlement.

### Automated Margin & Fee Routing

Implements an atomic, rule-based fee engine inside the database transaction boundary. It automatically calculates percentage or flat-rate margins on commercial transfers and routes the platform’s revenue cut into a central treasury wallet in a single, irreversible step.

### Multi-Currency Custody & FX Swaps

Upgrades the asset schema to support multi-fiat custody (USD, EUR, GBP, JPY). It integrates an FX rate oracle to execute cross-currency atomic swaps, maintaining exact precision math that respects ISO currency exponents and minor-unit rules.

### Time-Series Table Partitioning

Optimizes the append-only ledger for sub-millisecond query performance at scale using **PostgreSQL native time-series partitioning**. It automatically shards historical transaction data by month or quarter, keeping active indexes lean while streamlining cold-storage data migration.

```

```

```

```
