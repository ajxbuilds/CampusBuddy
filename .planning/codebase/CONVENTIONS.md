# Codebase Conventions

This document outlines the coding standards, naming conventions, linting rules, and styling guidelines adopted in the CampusBuddy codebase.

## 1. Coding Styles & Paradigms

### Frontend
- **Framework**: React 19 with Vite.
- **Language**: TypeScript is used exclusively (`.ts`, `.tsx`).
- **Paradigm**: Functional components utilizing React Hooks. 
- **Styling**: Utility-first CSS using Tailwind CSS (`className` attributes extensively). Components are styled directly without separate CSS files.

### Backend
- **Framework**: FastAPI (Python).
- **Language**: Python 3 (async features heavily utilized).
- **Paradigm**: Asynchronous API endpoints (`async def`). 
- **Database Access**: SQLAlchemy with async sessions (`AsyncSessionLocal`) and async queries (`select()`).
- **Structure**: Separation of concerns is maintained with routers (`api`), business logic (`services`), database models (`models`), and Pydantic validation models (`schemas`).

## 2. Naming Conventions

### Frontend
- **Components**: PascalCase (e.g., `DashboardComponent.tsx`).
- **Variables & Functions**: camelCase (e.g., `fetchData`, `userData`).
- **Types/Interfaces**: PascalCase.

### Backend
- **Files/Modules**: snake_case (e.g., `ai_service.py`, `test_api.py`).
- **Classes/Models**: PascalCase (e.g., `FacultyMember`, `Subject`).
- **Functions & Variables**: snake_case (e.g., `generate_guidance`, `db_session`).
- **Constants**: UPPER_SNAKE_CASE.

## 3. Linting Rules & Formatting

Currently, the project takes a relaxed approach to strict linting and formatting:
- **Frontend**: 
  - Relies on TypeScript compiler checks (`tsc`).
  - No explicit `.eslintrc` or `.prettierrc` configuration is defined in the repository, meaning developers should rely on standard IDE defaults or standard TypeScript language server diagnostics.
- **Backend**:
  - No strict formatting tools like `Black`, `Flake8`, or `Ruff` are enforced via configuration files at the root level.
  - Follows general PEP-8 guidelines implicitly.

## 4. Specific Tooling Conventions

- **Icons**: `lucide-react` is the standard library used for icons.
- **Charts**: `recharts` is used for rendering charts/graphs.
- **Animations**: `framer-motion` / `gsap` (Wait, GSAP and Anime.js are in dependencies, animations should leverage these libraries).
- **Class Merging**: `tailwind-merge` and `clsx` are used to cleanly merge conditionally applied Tailwind classes.
