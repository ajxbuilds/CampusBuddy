# Testing Practices

This document outlines the testing frameworks, strategies, and coverage areas for the CampusBuddy project.

## Backend Testing
- **Frameworks:** Instead of a dedicated test runner like `pytest` or `unittest`, the backend employs custom Python scripts (`test_api.py`, `test_complete_platform.py`, `test_wave3_live.py`).
- **Strategy:** Lightweight integration and end-to-end (E2E) testing. The tests utilize `httpx.AsyncClient` along with `ASGITransport` to run requests against the FastAPI app instance asynchronously.
- **Assertion Method:** Standard Python `assert` statements wrapped within `asyncio.run()`.
- **Test Locations:** Placed directly in the `backend/` root directory.
- **Coverage Areas:**
  - Health checks.
  - End-to-end user workflows (e.g., student and admin logins).
  - Core API functionalities: CRUD operations for complaints, fetching categories, etc.
  - AI integrations (e.g., AI chatbot procedure diagnosis).
  - Gamification (leaderboard) and community features (Q&A posts).

## Frontend Testing
- **Frameworks:** Currently, there are no frontend testing libraries (like Vitest, Jest, Playwright, or Cypress) configured in the `package.json`. No `.test.tsx` or `.spec.tsx` files are present in the frontend directory.
- **Strategy:** Relies primarily on manual testing and robust static typing using TypeScript.
- **Coverage Areas:** N/A (Automated tests are currently absent).

## Overall Strategy
The project currently relies heavily on backend API tests to ensure functional correctness, while the frontend is dependent on developer manual validation. Future iterations could benefit from introducing unit tests (`pytest` for backend, `Vitest`/`React Testing Library` for frontend) and E2E tools like `Playwright` to validate the UI systematically.
