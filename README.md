# Proper Rent

Proper Rent is a Phase 1 website and chatbot MVP for UK lettings lead generation. The initial scaffold follows `docs/11-phase-1-implementation-plan.md` P1.0: a runnable FastAPI backend, a runnable Next.js frontend shell, environment documentation, tests, and CI.

Phase 1 deliberately excludes listings, Scraye sync, property search, social channels, RAG, and commission tracking..

## Local Setup

Copy the sample environment file before running services:

```bash
cp .env.example .env
```

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
python -m pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

Health check:

```bash
curl http://localhost:8000/api/v1/health
```

Backend verification:

```bash
cd backend
ruff check .
ruff format --check .
mypy app
pytest
python scripts/export_openapi.py --check ../contracts/openapi.json
pip-audit -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`.

Frontend verification:

```bash
cd frontend
npm run lint
npm run typecheck
npm run test
npm run contract:check
npm run test:e2e
npm run build
npm run smoke:public
npm audit --audit-level=high
```

Read-only production smoke:

```bash
cd frontend
npm run smoke:prod
```

## Phase 1 Boundaries

- Backend owns API routes, future scoring, future AI orchestration, notifications, and admin routes.
- Frontend is presentation-only and calls the backend API.
- `properties` and `transactions` remain schema-only future placeholders and are not exposed by Phase 1 routes.
- Public APIs must not expose internal fields such as intent scores, fintech flags, assignment data, or system prompts.
