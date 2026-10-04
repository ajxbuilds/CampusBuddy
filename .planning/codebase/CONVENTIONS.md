# Codebase Conventions

This document outlines the coding standards, conventions, and practices employed in the CampusBuddy project.

## Frontend (React + TypeScript)
- **Framework & Build Tool:** React 19, built and served using Vite.
- **Language:** TypeScript for static typing and improved developer experience.
- **Styling:** Tailwind CSS is used extensively for styling, utility classes, and responsive design.
- **Linting & Formatting:** No explicit ESLint or Prettier configurations (`.eslintrc`, `.prettierrc`) are currently present. Code quality relies on standard TypeScript compiler checks and developer discipline.
- **Component Structure:** Functional components with React Hooks. Organized into logical directories (`components`, `pages`, `services`, `types`, etc.).

## Backend (FastAPI + Python)
- **Framework:** FastAPI is used for building high-performance, asynchronous REST APIs.
- **Language:** Python 3 (async/await paradigm).
- **Type Annotations:** Strong usage of Python type hints, a core requirement for FastAPI route definitions, validation (via Pydantic), and serialization.
- **ORM & Database:** SQLAlchemy 2.0 (asynchronous) with aiosqlite for database interactions.
- **Linting & Formatting:** No explicit tools like `flake8`, `black`, or `ruff` are defined in the requirements. Code follows standard PEP 8 naming conventions.
- **Authentication:** JWT-based authentication using `python-jose` and `passlib`.

## General Naming Conventions
- **Files/Directories:**
  - Frontend components and pages: PascalCase (e.g., `ComplaintCard.tsx`, `CommunityPage.tsx`).
  - Backend modules: snake_case (e.g., `main.py`, `test_api.py`).
- **Variables & Functions:** camelCase in TypeScript, snake_case in Python.
- **Classes/Interfaces:** PascalCase across both TypeScript and Python.
