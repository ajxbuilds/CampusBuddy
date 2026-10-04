# Directory Structure

The CampusBuddy project is structured as a monorepo containing both the frontend and backend applications.

## Root Directory
- `.planning/`: Project planning, tracking, and documentation artifacts.
  - `codebase/`: Codebase mapping and architectural documentation.
- `backend/`: Python FastAPI backend application.
- `frontend/`: React TypeScript frontend application.
- `uploads/`: Directory for uploaded files.
- `campusbuddy.db`: SQLite database file.

## Backend (`/backend`)
A standard FastAPI layered architecture.
- `app/`: Main application code.
  - `api/`: API router definitions and route handlers.
  - `core/`: Core configurations, security, dependencies, and setup.
  - `models/`: SQLAlchemy ORM database models.
  - `schemas/`: Pydantic models for data validation and serialization.
  - `services/`: Business logic and database operations (service layer).
  - `main.py`: FastAPI application entry point.
- `venv/`: Python virtual environment.
- `requirements.txt`: Python dependencies.
- `seed.py` / `test_*.py`: Scripts for database seeding and testing.

## Frontend (`/frontend`)
A modern React application scaffolded with Vite.
- `src/`: Source code for the React application.
  - `assets/`: Static assets like images or icons.
  - `components/`: Reusable React UI components.
  - `context/`: React Context providers for global state management.
  - `pages/`: Top-level page components corresponding to routes.
  - `services/`: API client functions to communicate with the backend.
  - `types/`: TypeScript interface and type definitions.
  - `App.tsx`: Root component setting up routing and layout.
  - `main.tsx`: Entry point rendering the React tree to the DOM.
- `public/`: Static files served directly by Vite.
- `package.json`: NPM dependencies and scripts.
- `tailwind.config.js` / `postcss.config.js`: Tailwind CSS configuration.
- `vite.config.ts`: Vite bundler configuration.
