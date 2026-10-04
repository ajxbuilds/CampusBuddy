# Codebase Concerns: CampusBuddy

This document outlines potential technical debt, security risks, scalability bottlenecks, and code quality issues identified during the exploration of the CampusBuddy codebase.

## 1. Security Risks

### 1.1. Insecure Token Storage & Lifespan
- **Long-lived Access Tokens**: In `backend/app/core/config.py`, `ACCESS_TOKEN_EXPIRE_MINUTES` is set to `60 * 24 * 7` (7 days). Using access tokens with such long expiration windows is highly insecure. If a token is compromised, the attacker has a week of uninterrupted access.
- **Missing Refresh Tokens**: The system relies on a single token model rather than the industry-standard short-lived access token (e.g., 15-60 mins) combined with a secure refresh token.
- **XSS Vulnerability via SessionStorage**: The frontend uses `sessionStorage.getItem('cb_token')` (in `frontend/src/services/api.ts`). Storing JWTs in Web Storage makes them susceptible to Cross-Site Scripting (XSS) attacks. They should be migrated to `HttpOnly` cookies.

### 1.2. Exposed Development / Mock Endpoints
- **`/google/dev-simulate` Route in Production**: The `auth.py` router exposes a `dev-simulate` endpoint for Google authentication. While there is a guard against generating `ADMIN` roles, this endpoint is not strictly gated by environment flags. If deployed to production, anyone could use this endpoint to bypass authentication and generate valid student profiles.

### 1.3. Hardcoded Secrets
- `config.py` provides a hardcoded fallback for the secret key (`campusbuddy-super-secret-production-key-2026-secure`). If an environment variable is omitted during deployment, the system defaults to a universally known key, instantly compromising all JWTs.

### 1.4. Dependency Weaknesses
- **Passlib & Bcrypt Incompatibility**: The `requirements.txt` specifies `passlib[bcrypt]>=1.7.4` alongside `bcrypt==4.0.1`. Passlib is essentially unmaintained and incompatible with newer bcrypt structures, which can lead to runtime `TypeError` issues during password hashing operations on certain systems.

---

## 2. Scalability Bottlenecks

### 2.1. Local File System Uploads
- **Disk-Bound Storage**: The `complaints.py` router stores user attachment uploads directly into `uploads/complaints` via local disk I/O. This breaks horizontal scalability. If multiple backend instances (e.g., Docker containers) are deployed behind a load balancer, they will not share the same file system, resulting in missing files and broken image links.
- **Solution needed**: File uploads must be offloaded to a cloud storage provider (e.g., AWS S3, Google Cloud Storage, or Azure Blob).

### 2.2. SQLite Concurrency Limitations
- **Default Database**: The backend heavily falls back on `sqlite+aiosqlite:///./campusbuddy.db`. While appropriate for initial evaluation or very small-scale use cases, SQLite handles concurrent database writes poorly, relying on database locks. High traffic (e.g., many users voting, posting, or submitting complaints simultaneously) will cause `Database is locked` errors.

### 2.3. Memory-Heavy File Processing
- File uploads are processed in memory before being written via `asyncio.to_thread`. Heavy simultaneous file uploads might bloat the memory consumption of the FastAPI worker, hindering asynchronous performance. File streams should ideally be used for direct-to-storage uploads.

---

## 3. Technical Debt & Code Quality

### 3.1. Hardcoded Environment Variables in Frontend
- In `frontend/src/services/api.ts`, the backend API base is explicitly hardcoded: `export const API_BASE = 'http://localhost:8000/api';`. This severely degrades deployment flexibility. Any attempt to deploy the frontend to a remote server (e.g., Vercel, Netlify) will result in it trying to query `localhost` instead of the production API. This must be migrated to `import.meta.env.VITE_API_BASE_URL`.

### 3.2. Configuration Inconsistencies
- `config.py` declares the maximum upload limit as `MAX_UPLOAD_SIZE_MB = 10`. However, the actual endpoint logic in `complaints.py` enforces a `5MB` limit (`MAX_FILE_SIZE = 5 * 1024 * 1024`). These split-brain constants will confuse administrators trying to adjust limits and lead to unexpected rejections.

### 3.3. Database Query Optimization (N+1 Risks)
- The backend extensively utilizes `selectinload` for populating related models (e.g., categories, students, assignees, attachments, history, escalations on complaints). While it prevents basic N+1 queries, returning large unpaginated lists of these complex aggregated objects (e.g., `/complaints` or `/community/posts`) will heavily impact API response times and database load.

### 3.4. Lack of Standard Testing Suite
- The root directory contains ad-hoc testing scripts like `test_api.py`, `test_complete_platform.py`, and `verify_platform.py`. There is no formalized test suite (like a `tests/` directory utilizing `pytest`), which makes regression testing during refactoring fragile and manual.
