# Requirements Specification - CampusBuddy

## Functional Requirements

### 1. Authentication & Role-Based Access Control (RBAC)
- **REQ-AUTH-01**: Secure registration and login with JWT access tokens.
- **REQ-AUTH-02**: Support 4 distinct roles: Student, Teacher, Parent, Administrator.
- **REQ-AUTH-03**: Strict data isolation: Students can only view their own complaints; Parents can only view complaints of their linked student; Teachers see complaints assigned to their department/themselves; Admins have full access.

### 2. AI Procedure Guidance Assistant
- **REQ-AI-01**: Conversational chatbot interface providing guidance on college procedures, fees, hostels, examinations, and grievance categories.
- **REQ-AI-02**: Clear informational disclaimer: Guidance is not official college policy.
- **REQ-AI-03**: No auto-submission: The AI assists in framing problems, but complaints require explicit student submission.
- **REQ-AI-04**: Offline/mock fallback when external LLM API keys are not supplied.

### 3. Peer Support Community
- **REQ-COM-01**: Question/post creation across 11 college categories.
- **REQ-COM-02**: Answer submission with threading.
- **REQ-COM-03**: Upvote mechanism with duplicate vote prevention.
- **REQ-COM-04**: Question authors can mark one answer as "Accepted Solution".
- **REQ-COM-05**: Faculty endorsement badge on answers provided by teachers.
- **REQ-COM-06**: Search, filtering by category, and sorting (Recent, Trending, Unanswered, Most Helpful).
- **REQ-COM-07**: Reporting inappropriate content for admin moderation.

### 4. Complaint Management
- **REQ-CMP-01**: Submit structured complaints with Title, Description, Category, Priority, and optional attachment.
- **REQ-CMP-02**: Unique identifier generation matching format: `CB-YYYY-XXXXXX`.
- **REQ-CMP-03**: Complete status lifecycle: `SUBMITTED`, `UNDER_REVIEW`, `ASSIGNED`, `IN_PROGRESS`, `AWAITING_INFORMATION`, `RESOLVED`, `REJECTED`, `ESCALATED`, `CLOSED`.
- **REQ-CMP-04**: Interactive visual status timeline tracking each transition with actor, timestamp, and remarks.

### 5. Escalation Management
- **REQ-ESC-01**: Automatic SLA breach detection based on category SLA hours.
- **REQ-ESC-02**: Student request for escalation if SLA is breached or complaint rejected.
- **REQ-ESC-03**: Admin workflow to approve/reject escalation, re-assign, and elevate priority.

### 6. Gamification & Reputation
- **REQ-GAM-01**: Points transactions ledger (+5 for answer, +10 for helpful upvote, +20 for accepted answer).
- **REQ-GAM-02**: Badges (First Helper, Problem Solver, Community Star, Top Contributor, Trusted Buddy).
- **REQ-GAM-03**: Leaderboard views: Weekly, Monthly, All-time.
- **REQ-GAM-04**: Anti-spam vote rate-limiting and self-voting restrictions.

### 7. Notifications
- **REQ-NOT-01**: In-app notifications for complaint status changes, assignments, escalations, answers, points, and badges.
- **REQ-NOT-02**: Mark as read and direct navigation to target entity.

### 8. Admin Control Center & Analytics
- **REQ-ADM-01**: Summary KPI cards (Total, Pending, In-Progress, Resolved, Escalated).
- **REQ-ADM-02**: Visual analytics charts (trends over time, category split, resolution rates, average turnaround).
- **REQ-ADM-03**: Searchable and filterable complaint management table with assignment and status update actions.
- **REQ-ADM-04**: User management and community content moderation queue.
- **REQ-ADM-05**: Comprehensive audit logs recording all administrative actions.

## Non-Functional Requirements
- **NFR-PERF-01**: Fast response times (< 200ms API responses).
- **NFR-SEC-01**: Password hashing using bcrypt, JWT token expiry, SQL injection prevention via SQLAlchemy ORM.
- **NFR-RES-01**: Fully responsive layout across mobile, tablet, and desktop viewports.
- **NFR-DEV-01**: Zero-configuration default database execution with instant seeding for evaluations and demos.
