# Architecture

## High-Level System Design
CampusBuddy is a full-stack web application designed with a client-server architecture.
- **Frontend (Client)**: A Single Page Application (SPA) built with React 19, TypeScript, and Vite. It handles the user interface, routing (via React Router), state management (React Context), and data visualization (Recharts).
- **Backend (Server)**: A RESTful API built with FastAPI (Python) running on Uvicorn. It handles business logic, authentication, and database interactions.
- **Database**: SQLite (via aiosqlite for asynchronous support) managed using SQLAlchemy as the Object-Relational Mapper (ORM).

## Data Flow
1. **User Interaction**: The user interacts with the React frontend.
2. **API Request**: The frontend makes asynchronous HTTP requests (REST API) to the backend using native fetch or similar service wrappers.
3. **Routing & Validation**: FastAPI receives the request, routes it to the appropriate endpoint, and validates incoming payloads using Pydantic schemas.
4. **Business Logic & DB Operations**: The API endpoint processes the request (often delegating to `services`), interacts with the database via SQLAlchemy models, and retrieves or modifies data.
5. **Response**: The backend returns JSON responses back to the frontend.
6. **UI Update**: The React app updates the UI based on the response, leveraging Context for global state changes.

## Main Components
### Frontend
- **React Components**: Modular UI components styled with Tailwind CSS.
- **Context/State**: Application state and authentication state management.
- **Services**: API client utilities to communicate with the backend.

### Backend
- **API Routers**: FastAPI endpoints organized by resource.
- **Models**: SQLAlchemy ORM classes mapping to database tables.
- **Schemas**: Pydantic models for data validation, request, and response serialization.
- **Services**: Encapsulated business logic bridging API routes and database operations.
- **Core**: Configuration, security (JWT authentication using python-jose and passlib), and database connection setup.

## Architectural Patterns
- **Separation of Concerns / N-Tier**: Distinct separation between presentation (frontend), application logic (backend), and data access (database).
- **RESTful API**: Standardized HTTP methods and resource-based URLs for client-server communication.
- **Repository/Service Pattern**: In the backend, data access and business rules are abstracted away from the route handlers.
- **Single Page Application (SPA)**: The frontend loads a single HTML page and dynamically updates content without reloading.
