# Technology Stack

## Languages
- **Python 3**: Used for the backend API and services.
- **TypeScript**: Used throughout the frontend for type-safe components.
- **HTML/CSS**: Structure and styling of the user interface.

## Frontend
- **Framework**: React (v19.3)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (v3.4)
- **Routing**: React Router DOM
- **Data Visualization**: Recharts
- **Icons**: Lucide React
- **PDF Generation**: jsPDF
- **Utilities**: clsx, tailwind-merge

## Backend
- **Framework**: FastAPI (with Uvicorn ASGI server)
- **Database**: SQLite (via `aiosqlite` for async support). Readily supports PostgreSQL.
- **ORM**: SQLAlchemy v2.0 (asyncio)
- **Data Validation & Settings**: Pydantic and Pydantic-Settings
- **Security & Authentication**:
  - `python-jose`: JWT token encoding/decoding
  - `passlib[bcrypt]`, `bcrypt`: Password hashing and verification
  - `python-multipart`: Form parsing
- **HTTP Client**: `httpx` (for async external requests)

## Infrastructure & Configuration
- **Environment Management**: `python-dotenv`
- **Package Management**: `npm` (Frontend), `pip` (Backend via `requirements.txt`)
