# Ecommerce Platform

Production-ready ecommerce starter: FastAPI + React + MySQL + Redis, orchestrated with Docker.

## Stack

- **Backend:** FastAPI, SQLAlchemy 2, Alembic, Pydantic v2, JWT auth
- **Frontend:** React 18, Vite, React Query, Zustand, React Router
- **Database:** MySQL 8.4
- **Cache / queue:** Redis 7
- **Reverse proxy:** Nginx

## Layout

```
.
├── backend/         FastAPI service (clean architecture: api → service → repo → model)
├── frontend/        React SPA (feature-sliced)
├── docker/          Shared Docker assets (nginx, mysql init)
├── docker-compose.yml
├── docker-compose.prod.yml
└── .env.example
```

## Quick start

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

docker compose up --build
```

Then:

- App:        http://localhost (via nginx)
- API docs:   http://localhost/docs
- Frontend:   http://localhost:5173
- Backend:    http://localhost:8000

## First-time DB migration

```bash
docker compose exec backend alembic revision --autogenerate -m "init"
docker compose exec backend alembic upgrade head
```

## Production

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Architecture

- `api/` — HTTP only; converts requests/responses, no business logic
- `services/` — business rules, transactions; owns the use case
- `repositories/` — data access; the only layer that touches the ORM
- `models/` — SQLAlchemy ORM
- `schemas/` — Pydantic DTOs

Dependency direction is one-way: `api → service → repository → model`.

## Testing

```bash
# backend
docker compose exec backend pytest

# frontend
docker compose exec frontend npm test
```
