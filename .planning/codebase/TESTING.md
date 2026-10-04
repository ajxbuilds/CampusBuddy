# Testing Practices

This document outlines the testing frameworks, coverage areas, locations of tests, and testing strategies used in the CampusBuddy project.

## 1. Test Frameworks

### Backend
- **Framework**: Custom standalone asynchronous Python scripts. 
- **Tooling**: `httpx.AsyncClient` with `ASGITransport` is heavily used to interact directly with the FastAPI ASGI application.
- **Runner**: There is no formal test runner (like `pytest` or `unittest`) configured. Tests are executed by directly running the python scripts (e.g., `python backend/test_api.py`).
- **Assertions**: Standard Python `assert` statements combined with detailed `print()` statements to track test progress and log results.

### Frontend
- **Framework**: No formal automated testing framework (such as Jest, Vitest, Cypress, or Playwright) is currently configured or set up in the frontend `package.json`.
- **Strategy**: Relies heavily on manual testing and the backend integration tests to ensure data flows correctly. 

## 2. Test Coverage Areas

Backend testing currently covers the major functional domains of the application:
- **API Endpoints**: Health checks, Authentication (Student and Admin logins).
- **Core Features**: Complaints (retrieval and categories), Community Q&A.
- **AI Integration**: Validation of AI Chat logic (structured diagnosis output).
- **Gamification**: Leaderboard endpoints.
- **Admin**: Dashboard metrics (total, pending, in-progress complaints).
- **Database & Data Seeding**: Scripts exist to verify the successful seeding and presence of Faculty, Subjects, Attendance, Fees, Notices, etc.

## 3. Locations of Tests

All testing files are currently located at the root of the `backend` directory:
- `backend/test_api.py`: Tests standard REST endpoints, user/admin flows, AI services, and gamification logic via `httpx`.
- `backend/test_complete_platform.py`: Tests direct database interactions using `AsyncSessionLocal` to verify the state of records in the database.
- `backend/test_wave3_live.py`: Specific scenario or wave-based testing script.
- `backend/verify_platform.py`: Another database state verification script.
- **Database**: Testing appears to interact with specific databases like `test.db` alongside `campusbuddy.db`.

## 4. Testing Strategies Used

- **Integration Testing via ASGI**: Instead of spinning up a live web server on a port, the tests use `ASGITransport` to pass requests directly to the FastAPI app object. This allows for fast, robust integration testing of HTTP routes without network overhead.
- **Direct Database Assertions**: State verification tests bypass the API completely to query the database using SQLAlchemy, ensuring that specific seeding scripts or complex data mutations are accurately reflected in the tables.
- **Log-Driven Feedback**: Rather than standard test reports (like XML or HTML coverage), the tests emit console output via descriptive print statements indicating PASS/FAIL status for each step.
- **No Mocking**: Tests seem to interact with real services and local databases rather than heavily utilizing mocks or stubs.
