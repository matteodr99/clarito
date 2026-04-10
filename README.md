# ✦ Clarito — AI-Powered Task Manager

> An intelligent task manager that uses AI to automatically analyze your tasks and suggest priority, category, and estimated time.

![Stack](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square)
![Stack](https://img.shields.io/badge/Frontend-Next.js-000000?style=flat-square)
![Stack](https://img.shields.io/badge/Database-PostgreSQL-336791?style=flat-square)
![Stack](https://img.shields.io/badge/AI-Gemini-4285F4?style=flat-square)
![Stack](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square)
![Stack](https://img.shields.io/badge/Tests-Pytest-0A9EDC?style=flat-square)
![CI](https://github.com/matteodr99/clarito/actions/workflows/test.yml/badge.svg)

---

## 🚀 Features

- **AI Integration** — Every task is analyzed by Gemini AI, which automatically suggests priority, category, and estimated time
- **Full CRUD** — Create, read, update, and delete tasks
- **Status Management** — Move tasks from *To Do* → *In Progress* → *Done* with a single click
- **Filters** — Filter tasks by status
- **Dark/Light Mode** — Smooth animated theme switching
- **Unit Tested** — 10 unit tests covering API endpoints and AI logic
- **CI/CD** — GitHub Actions automatically runs tests on every push and pull request
- **Auto-documented REST API** — Swagger UI available at `/docs` out of the box

---

## 🛠 Tech Stack

### Backend
- **[FastAPI](https://fastapi.tiangolo.com/)** — Modern, high-performance Python framework for REST APIs
- **[SQLAlchemy](https://www.sqlalchemy.org/)** — ORM for database management
- **[PostgreSQL](https://www.postgresql.org/)** — Relational database (Supabase in production)
- **[Google Gemini AI](https://ai.google.dev/)** — LLM for intelligent task analysis
- **[Pydantic](https://docs.pydantic.dev/)** — Data validation
- **[Pytest](https://pytest.org/)** — Unit testing

### Frontend
- **[Next.js 14](https://nextjs.org/)** — React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** — Type safety
- **[Tailwind CSS](https://tailwindcss.com/)** — Utility-first styling

### Infrastructure
- **[Docker](https://www.docker.com/)** — Containerization for local development
- **[Docker Compose](https://docs.docker.com/compose/)** — Local service orchestration
- **[Vercel](https://vercel.com/)** — Frontend + serverless backend deployment
- **[Supabase](https://supabase.com/)** — Managed PostgreSQL in production
- **[GitHub Actions](https://github.com/features/actions)** — CI/CD pipeline

---

## 📁 Project Structure

```
clarito/
├── .github/
│   └── workflows/
│       └── test.yml         # CI/CD pipeline
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI entry point
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── database.py      # Database configuration
│   │   └── routers/
│   │       └── tasks.py     # Task endpoints + AI logic
│   ├── tests/
│   │   ├── conftest.py      # Test configuration + fixtures
│   │   ├── test_tasks.py    # API endpoint tests
│   │   └── test_ai.py       # AI suggestion tests
│   ├── requirements.txt
│   └── Dockerfile
├── api/
│   └── tasks.py             # Vercel serverless handler
├── frontend/
│   └── app/
│       └── page.tsx         # Main UI
├── docker-compose.yml
├── vercel.json
├── requirements.txt         # Vercel Python dependencies
├── .env                     # Environment variables (never commit!)
└── README.md
```

---

## ⚙️ Setup & Installation

### Prerequisites

- [Docker](https://www.docker.com/get-started) and Docker Compose installed
- [Node.js](https://nodejs.org/) 18+ for the frontend
- A free API key from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone the repository

```bash
git clone https://github.com/matteodr99/clarito.git
cd clarito
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
GEMINI_API_KEY=your_api_key_here
DATABASE_URL=postgresql://clarito:clarito123@db:5432/clarito_db
```

### 3. Start the backend (locally)

```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

### 3. Start the backend with Docker

```bash
docker-compose up --build
```

The backend will be available at `http://localhost:8000`.

### 4. Start the frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.

---

## 🧪 Running Tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

Expected output:

```
tests/test_ai.py::test_get_ai_suggestion_returns_correct_fields PASSED
tests/test_ai.py::test_get_ai_suggestion_with_empty_description PASSED
tests/test_ai.py::test_get_ai_suggestion_invalid_json_raises PASSED
tests/test_tasks.py::test_get_tasks_empty PASSED
tests/test_tasks.py::test_create_task PASSED
tests/test_tasks.py::test_get_task_not_found PASSED
tests/test_tasks.py::test_get_task_found PASSED
tests/test_tasks.py::test_delete_task_not_found PASSED
tests/test_tasks.py::test_delete_task_success PASSED
tests/test_tasks.py::test_update_task_status PASSED

10 passed in 0.06s
```

Tests run automatically on every push and pull request via **GitHub Actions**.

---

## 📡 API Reference

Full interactive documentation is available at **[http://localhost:8000/docs](http://localhost:8000/docs)** (Swagger UI).

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/tasks/` | List all tasks |
| `POST` | `/tasks/` | Create a new task (with AI analysis) |
| `GET` | `/tasks/{id}` | Get a single task |
| `PATCH` | `/tasks/{id}` | Update a task |
| `DELETE` | `/tasks/{id}` | Delete a task |

### Example: Create a task

**Request**
```http
POST /tasks/
Content-Type: application/json

{
  "title": "Learn Next.js",
  "description": "Study the basics for the Clarito project"
}
```

**Response**
```json
{
  "id": 1,
  "title": "Learn Next.js",
  "description": "Study the basics for the Clarito project",
  "priority": "medium",
  "category": "study",
  "estimated_time": "2 hours",
  "status": "todo",
  "created_at": "2026-02-20T10:00:00Z"
}
```

---

## 🤖 How the AI Works

When you create a new task, Clarito sends the title and description to **Gemini AI**, which responds with a structured JSON containing:

- **priority** — `high`, `medium`, or `low`
- **category** — e.g. `work`, `study`, `personal`, `urgent`
- **estimated_time** — e.g. `30 minutes`, `2 hours`, `1 day`

You can always manually edit these values after creation.

---

## 🔁 CI/CD Pipeline

Every push and pull request to `main` triggers the GitHub Actions workflow which:

1. Sets up Python 3.11
2. Installs backend dependencies
3. Runs all 10 unit tests with Pytest
4. Reports pass/fail status directly on the commit and pull request

---

## 🚢 Production Deployment

### Backend + Frontend → Vercel

1. Create an account at [vercel.com](https://vercel.com)
2. Import the GitHub repository
3. Add environment variables:
   - `GEMINI_API_KEY`
   - `DATABASE_URL` (Supabase connection string with port 6543)
4. Vercel automatically deploys both the Next.js frontend and the Python serverless functions

### Database → Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Use the **Transaction Pooler** connection string (port 6543) for Vercel compatibility

---

## 🔮 Roadmap

- [ ] User authentication
- [ ] Drag & drop to reorder tasks
- [ ] Due date notifications
- [ ] Stats & analytics dashboard
- [ ] Calendar integration
- [ ] Integration tests

---

## 📄 License

MIT License — feel free to use this project as a base for your own work.

---

<p align="center">Built with ✦ AI and ☕ coffee</p>