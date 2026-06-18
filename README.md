# Proper Rent

Proper Rent is a Phase 1 website and chatbot MVP for UK lettings lead generation. The current codebase implements the Phase 1 website funnel: a FastAPI backend, a Next.js public/admin frontend, renter and landlord intake, chatbot orchestration, admin lead operations, notifications, contract artifacts, tests, CI, and smoke checks.

Phase 1 deliberately excludes listings, Scraye sync, property search, social channels, RAG, and commission tracking.

## Current State

- Backend: FastAPI app under `backend/app` with `/api/v1/health`, `/chat`, `/leads`, `/landlords`, and `/admin/*` routes.
- Data: SQLAlchemy models and Alembic migrations for Phase 1 operational tables. `properties` and `transactions` exist only as schema placeholders and are not exposed by any Phase 1 route.
- AI: OpenRouter access is isolated in `services/llm_client.py`; chat orchestration, prompt rules, PII scrubbing, fallback behavior, and session/renter context checks live behind the backend API.
- Intake: renter and landlord endpoints enforce consent, persist submissions, trigger mocked/tested Resend notifications, and keep public responses free of internal scoring/flags.
- Admin: Supabase JWT verification plus `agents.role='admin'` gates lead and landlord list/detail/update routes.
- Frontend: Next.js public pages, renter/landlord forms, chat widget, legal pages, admin login/protected shell, lead and landlord management views.
- Verification: backend coverage gate, OpenAPI drift checks, generated frontend API types, Vitest component/unit coverage, Playwright mocked e2e flows, public/production smoke scripts, dependency audit, and secret scan.

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

- Backend owns API routes, lead scoring, AI orchestration, notifications, and admin routes.
- Frontend is presentation-only and calls the backend API.
- `properties` and `transactions` remain schema-only placeholders and are not exposed by Phase 1 routes.
- Public APIs must not expose internal fields such as intent scores, fintech flags, assignment data, or system prompts.

## Documentation Map

- `docs/00-project-overview.md` — product and architecture orientation.
- `docs/04-api-contracts.md` — current backend API contract and deferred API surfaces.
- `docs/08-test-plan.md` and `docs/13-p1.6.2-test-coverage-completion-plan.md` — verification expectations and current gates.
- `docs/09-roadmap.md` — phase boundaries and deferred scope.
- `docs/11-phase-1-implementation-plan.md` — Phase 1 implementation status, checklist, and exit-review frame.
