# 🎓 CampusBuddy - College Problem Solving Platform

> **PBL (Project-Based Learning) & Exhibition Edition**  
> *A unified, transparent college problem-solving ecosystem connecting students, faculty, parents, and administration.*

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React_18_%2B_TypeScript-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Bundler-Vite_6.x-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Styles-Tailwind_CSS_3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![SQLAlchemy](https://img.shields.io/badge/ORM-SQLAlchemy_2.0_Async-D71F00.svg?logo=python&logoColor=white)](https://www.sqlalchemy.org)
[![Dual Database](https://img.shields.io/badge/Database-PostgreSQL_%2F_SQLite_Dual-4169E1.svg?logo=postgresql&logoColor=white)](https://postgresql.org)

---

## 🌟 Overview & Core Philosophy

CampusBuddy transforms traditional, opaque college grievance cells into an interactive, collaborative ecosystem.

$$\text{Connect} \longrightarrow \text{Understand} \longrightarrow \text{Help} \longrightarrow \text{Solve} \longrightarrow \text{Earn Points}$$

1. **Connect**: Students, Teachers, Parents, and Administrators share a role-based workspace with verified permissions.
2. **Understand**: A ChatGPT-style **AI Procedure Guide** clarifies college policies, required documents, and diagnoses whether an issue is suitable for peer discussion or requires formal administrative action.
3. **Help**: A college-focused **Peer Support Community** (Academics, Exams, Hostel, Fees, Scholarships, Infrastructure) enables peer-to-peer collaboration with faculty endorsements and verified answers.
4. **Solve**: Formal **Complaint Management** assigns structured tracking codes (`CB-YYYY-XXXXXX`), calculates SLA deadlines, renders a live visual timeline, and enables automatic breach escalations.
5. **Earn Points**: A gamified reputation ledger awards points (+5 for answers, +10 for upvotes, +20 for accepted solutions) and unlocks achievement badges across weekly, monthly, and all-time leaderboards.

---

## 👥 4 User Roles & Access Control

| Role | Demo Credentials | Key Capabilities |
| :--- | :--- | :--- |
| **Student** | `student@campusbuddy.edu` / `Student@123` | File formal complaints, track visual status timeline, request escalations, ask AI assistant, post/answer peer questions, earn points/badges, view leaderboard. |
| **Teacher** | `teacher@campusbuddy.edu` / `Teacher@123` | Inspect assigned department complaints, log official progress remarks, provide faculty-endorsed answers on the community forum. |
| **Parent** | `parent@campusbuddy.edu` / `Parent@123` | Read-only transparent monitoring of linked ward's complaints, SLA status, escalation alerts, and resolution updates. |
| **Administrator** | `admin@campusbuddy.edu` / `Admin@123` | Master control center: assign staff to complaints, approve/reject escalations, review moderation reports, inspect analytics charts, and review system audit trails. |

*Tip: A 1-Click Interactive Demo Switcher is located in the top navbar and landing page for instant role-switching during evaluations.*

---

## 🏗️ System Architecture

```
CampusBuddy
├── backend/                        # FastAPI (Python 3.12) REST API
│   ├── app/
│   │   ├── api/                    # Modular API Routers (Auth, Complaints, Escalations, Community, Gamification, AI, Admin)
│   │   ├── core/                   # Async DB connection, JWT Security, App Configuration
│   │   ├── models/                 # SQLAlchemy 2.0 Async Models (16 Entities)
│   │   ├── schemas/                # Pydantic v2 validation contracts
│   │   └── services/               # Business logic (AI diagnostic KB, points engine, SLA tracking)
│   ├── seed.py                     # Rich multi-role demo data seeder
│   ├── test_api.py                 # Automated verification test suite
│   └── requirements.txt
│
├── frontend/                       # Modern React 18 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── components/             # Reusable UI components (Timelines, PostCards, Modals, Navbar)
│   │   ├── context/                # AuthContext with 1-click demo switcher
│   │   ├── pages/                  # Landing, Login, Register, Role Dashboards, Complaints, Q&A, AI Guide
│   │   ├── services/api.ts         # Type-safe API client with JWT interceptor
│   │   └── types/                  # Domain TypeScript interfaces
│   └── tailwind.config.js
└── .planning/                      # GSD Engineering Architecture & Milestones
```

---

## 🗄️ Normalized Database Schema (16 Entities)

- **`users`**: Email, password hash (Bcrypt), full name, role (`STUDENT`, `TEACHER`, `PARENT`, `ADMIN`), department, avatar.
- **`student_profiles`**: Roll number, semester, program, cumulative reputation points.
- **`parent_links`**: Guardian-student link for verified transparent access.
- **`complaint_categories`**: Category name, code, in-charge department, SLA turnaround hours.
- **`complaints`**: Unique code (`CB-2026-001245`), student FK, category FK, title, description, priority, status, assignee FK, attachment URL, SLA deadline.
- **`complaint_status_history`**: Chronological log of every status transition with actor FK and remarks.
- **`complaint_escalations`**: Escalation level (`LEVEL_1`, `LEVEL_2`), reason, SLA breach flag, status (`PENDING`, `APPROVED`, `REJECTED`), admin notes.
- **`community_posts`**: Author FK, title, content, category, views, upvotes count, answers count, solved flag.
- **`community_answers`**: Post FK, author FK, content, upvotes count, accepted flag, faculty endorsed flag.
- **`votes`**: Unique user vote constraint preventing duplicate voting or self-voting.
- **`reports`**: Flagged posts/answers for administrative moderation.
- **`badges`**: Name ("First Helper", "Problem Solver", "Community Star", "Top Contributor", "Trusted Buddy"), criteria, icon.
- **`user_badges`**: Badges unlocked by users.
- **`points_transactions`**: Audit ledger of all reputation points credited.
- **`notifications`**: In-app notifications with deep-links and unread badges.
- **`audit_logs`**: System audit trail capturing actor, action, resource, and timestamp.

---

## 🚀 Quickstart & Setup Instructions

### ⚡ 1-Click Launch (Windows)
Simply double-click or run:
```cmd
start.bat
```
This automatically verifies the environment, checks database seed data, boots both backend and frontend servers in separate console windows, and opens `http://localhost:5173` in your default browser.

---

### Prerequisites
- Python 3.10+ (Python 3.12 recommended)
- Node.js 18+ (Node 22 LTS tested)
- Git

### Manual Startup (Step-by-Step)

# Activate virtual environment
# Windows:
backend/venv/Scripts/activate
# Linux/macOS:
# source backend/venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Populate database with rich demo data
python backend/seed.py

# (Optional) Run automated backend validation suite
python backend/test_api.py

# Start FastAPI server
uvicorn app.main:app --reload --port 8000
```
*Backend runs at: `http://localhost:8000` (Interactive Swagger Docs at `http://localhost:8000/docs`)*

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
*Frontend runs at: `http://localhost:5173`*

---

## 🧪 Critical End-to-End Demo Flow (Viva & Evaluation)

Follow this exact flow during project defense to demonstrate all 14 milestones working in harmony:

1. **Open `http://localhost:5173`**:
   - Explore public Landing Page explaining the 5 pillars.
   - Click **"Student"** on the 1-Click Interactive Demo Sandbox.
2. **AI Procedure Diagnostic Guide**:
   - Click **AI Guide** in the navbar.
   - Ask: *"My semester fee payment was debited from my bank but portal says unpaid"*.
   - Observe AI response: Recommends **FEES & Accounts** category, Finance Section office, required documents (UTR receipt, Challan), and advises filing a formal complaint. Notice the clear informational disclaimer.
3. **Peer Support Community Q&A**:
   - Go to **Community**, inspect category filters (Academics, Exams, Hostel, Fees, etc.).
   - Filter by **"Trending"** or **"Most Helpful"**.
   - Open a question, submit an answer & upvote peer contributions.
4. **Gamification & Leaderboard**:
   - Check **Leaderboard** to see Aarav Sharma's rank, earned points, and unlocked badges (*First Helper*, *Problem Solver*, *Community Star*).
5. **Formal Complaint Filing**:
   - Go to **Complaints** -> Click **"File New Complaint"**.
   - Enter details, select Category (e.g. Fees & Accounts), Priority (High).
   - Submit and receive a newly generated unique identifier (e.g. `CB-2026-001248`).
6. **Live Chronological Timeline**:
   - Open the complaint detail view to inspect the visual resolution progress timeline.
7. **Switch to Administrator / Faculty**:
   - Using the top-right demo switcher, switch to **Admin User**.
   - Navigate to `/admin`: view real-time KPIs (Total, Pending, In Progress, Escalated), Category volume charts, and 7-day Intake velocity.
   - Assign the newly submitted complaint to **Prof. Vikram Malhotra (Teacher)** and change status to `IN_PROGRESS`.
8. **Student Notification & Escalation**:
   - Switch back to **Student**: observe notification bell indicator.
   - If SLA is breached, click **"Request Escalation"** with a level and reason.
9. **Parent Transparency**:
   - Switch to **Parent (Sunil Sharma)**: see linked ward's complaints with read-only transparency and real-time status updates.
10. **Resolution**:
    - Mark complaint `RESOLVED` with official remarks; observe timeline completion.

---

## 🔒 Security & Data Isolation Architecture

- **Password Security**: Salted Bcrypt hashing via `passlib`.
- **JWT Authentication**: HS256 algorithm with configurable expiry.
- **Strict Data Isolation**:
  - Students cannot read or mutate other students' private complaints.
  - Parents can only inspect complaints belonging to their linked ward.
  - Teachers are restricted to assigned department complaints.
  - Role guards (`require_roles(["ADMIN", "TEACHER"])`) enforce strict authorization.
- **Zero-Config Database Engine**:
  - Defaults to async SQLite (`sqlite+aiosqlite:///./campusbuddy.db`) for immediate offline demonstration without installing third-party database servers.
  - Seamlessly switches to PostgreSQL (`postgresql+asyncpg://user:pass@host:5432/campusbuddy`) by simply adding `DATABASE_URL` in `.env`.

---

## 📝 Viva Defense FAQ

- **Q: How does the AI Assistant avoid making unauthorized official decisions?**  
  *A: The AI Assistant serves strictly as an informational diagnostic guide. It extracts the problem category, required documents, and procedure without ever auto-submitting complaints. Explicit student confirmation is mandatory.*

- **Q: How is spam prevented in the reputation system?**  
  *A: Unique vote constraints enforce one vote per user per target. Users cannot upvote their own questions or answers. Duplicate point transactions for identical references are rejected by the service layer.*

- **Q: How are SLAs enforced?**  
  *A: Each category defines an SLA threshold in hours. The backend calculates `sla_deadline = created_at + sla_hours`. The system automatically detects SLA breaches, flagging overdue complaints and unlocking the student escalation trigger.*

---

## 🔑 Google OAuth 2.0 & Gmail Sign-In Setup

CampusBuddy supports **dual authentication**:
1. **Traditional Email + Password** (Default, with Bcrypt hashing and 1-Click Demo Accounts)
2. **Continue with Google** (Official Google OAuth 2.0 / OpenID Connect with account linking)

### Google Cloud Console Configuration Steps

1. **Visit Google Cloud Console**:
   Navigate to [console.cloud.google.com](https://console.cloud.google.com/) and create or select a project (e.g., `CampusBuddy`).

2. **Configure OAuth Consent Screen**:
   - Go to **APIs & Services** → **OAuth consent screen**.
   - User Type: Select **External** and click **Create**.
   - App Information:
     - App name: `CampusBuddy`
     - User support email: Select your email
     - Developer contact info: Enter your email
   - Scopes: Click **Add or Remove Scopes** and select:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
     - `openid`
   - Save and continue.

3. **Create OAuth Client ID Credentials**:
   - Go to **APIs & Services** → **Credentials**.
   - Click **+ CREATE CREDENTIALS** → **OAuth client ID**.
   - Application type: **Web application**.
   - Name: `CampusBuddy Web Client`.
   - **Authorized JavaScript origins**:
     - `http://localhost:5173`
     - `http://localhost:8000`
   - **Authorized redirect URIs**:
     - `http://localhost:8000/api/auth/google/callback`
   - Click **CREATE**.

4. **Add Credentials to Backend Environment**:
   Copy the generated **Client ID** and **Client Secret** into `backend/.env`:
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=GOCSPX-your-client-secret
   GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
   FRONTEND_URL=http://localhost:5173
   ```

5. **Authentication Security & Account Linking**:
   - **Existing User Linking**: If a user previously registered with email/password (e.g. `student@campusbuddy.edu`) logs in with Google, CampusBuddy automatically links the Google provider ID (`sub`), updates their avatar, and logs them in seamlessly without erasing complaints, points, or badges.
   - **New User Onboarding**: New Google sign-ups are routed to an onboarding screen to select their campus role (`Student`, `Teacher`, or `Parent`) and fill out academic details.
   - **Strict Admin Security Guard**: Administrator (`ADMIN`) accounts **cannot** be registered through public Google sign-up. Any attempt to onboard with the `ADMIN` role is blocked at the API level with HTTP `403 Forbidden`.
   - **Local Developer Simulation**: If Google Cloud credentials are not yet configured, developers can click "Try Google OAuth Simulation (Dev Mode)" in the login dialog or use `/api/auth/google/dev-simulate` to test the complete OAuth callback and onboarding flow offline.

---

## 📄 License
Academic & Project Based Learning (PBL) Educational License &copy; 2026 CampusBuddy Contributors.
