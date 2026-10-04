# Codebase Concerns

This document maps out potential technical debt, security risks, scalability bottlenecks, and code quality issues identified in the CampusBuddy codebase.

## 🚨 Security Risks (High Severity)

### 1. Unauthenticated Static Mount for Sensitive Uploads
- **Location:** `backend/app/main.py`
- **Issue:** The application mounts the `uploads` directory as static files (`app.mount("/uploads", StaticFiles(directory="uploads"))`). 
- **Impact:** Although there is an authenticated download endpoint (`/api/complaints/attachments/{id}`) that performs authorization checks, the static mount completely bypasses this. Anyone with the URL (even if it uses a UUID) can access sensitive complaint attachments directly.

### 2. Hardcoded Default Secret Key
- **Location:** `backend/app/core/config.py`
- **Issue:** The `SECRET_KEY` falls back to a hardcoded string `"campusbuddy-super-secret-production-key-2026-secure"` if not set in the environment.
- **Impact:** If deployed to production without overriding this environment variable, attackers can easily forge JWT access tokens and take over any account.

### 3. Long-Lived Access Tokens
- **Location:** `backend/app/core/config.py`
- **Issue:** `ACCESS_TOKEN_EXPIRE_MINUTES` is set to 7 days (`60 * 24 * 7`).
- **Impact:** Without a refresh token mechanism, a compromised JWT remains valid for a very long time, increasing the attack window.

## ⚠️ Scalability Bottlenecks (Medium Severity)

### 1. Local Disk Storage for Uploads
- **Location:** `backend/app/api/complaints.py`
- **Issue:** Attachments are saved directly to the local disk (`uploads/complaints`).
- **Impact:** This approach is not scalable for multi-node deployments (e.g., Kubernetes, AWS ECS). Uploaded files will only exist on the specific server that handled the request, breaking availability. An object storage solution (like AWS S3 or MinIO) should be used.

### 2. SQLite as the Default Database
- **Location:** `backend/app/core/config.py`
- **Issue:** The default database is `sqlite+aiosqlite`.
- **Impact:** While PostgreSQL is supported via `DATABASE_URL`, using SQLite limits concurrent write operations and can lead to database locks under high user load. 

## 🛠 Technical Debt & Code Quality (Medium to Low Severity)

### 1. Improper Database Migrations
- **Location:** `backend/app/main.py`
- **Issue:** Schema migrations (like adding new columns) are performed using raw SQL `ALTER TABLE` queries inside broad `try...except` blocks during app startup. Errors are silently swallowed (`pass`).
- **Impact:** This is highly error-prone, lacks version control, and makes rollback impossible. The project should adopt a proper migration tool like **Alembic**.

### 2. Implicit Commits in Database Dependency
- **Location:** `backend/app/core/database.py`
- **Issue:** The `get_db` async generator automatically calls `await session.commit()` before closing the session.
- **Impact:** This is an anti-pattern. Transactions should be explicitly committed in the service or endpoint layer. Implicit commits can lead to accidental data modifications if ORM objects are inadvertently mutated during read-heavy operations.

### 3. Hardcoded CORS and Development Defaults
- **Location:** `backend/app/core/config.py`
- **Issue:** `BACKEND_CORS_ORIGINS` defaults to local development URLs. 
- **Impact:** Requires strict environment variable overrides in production to prevent misconfigurations.
