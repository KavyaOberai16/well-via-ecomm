# Skill: Docker Operations

A recipe for building, running, and troubleshooting the project's containers.

Used by: `devops-agent` (and any agent running migrations or the stack).

## Images

| Image | Source | Purpose |
|-------|--------|---------|
| `ecom-backend` | `backend/Dockerfile` | FastAPI service |
| `ecom-frontend` | `frontend/Dockerfile` | React build → nginx static |

## Build

```powershell
docker build -t ecom-backend  ./backend
docker build -t ecom-frontend ./frontend
```

## Run the dev stack

Local mysql + redis:
```powershell
docker compose up --build
```

Remote MySQL (skip the local mysql container):
```powershell
docker compose up --build backend redis frontend nginx
```

## One-shot containers (migrations, scripts)

```powershell
docker run --rm `
  --env-file ./backend/.env `
  -v ${PWD}/backend:/app -w /app `
  ecom-backend alembic upgrade head
```

The volume mount makes generated files (new migration scripts) persist to the host.

## Production

```powershell
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Inspect & troubleshoot

```powershell
docker ps
docker logs <container> --tail 60
docker exec -it <container> sh
docker compose down            # stop stack
docker compose down -v         # stop + drop volumes (DELETES local DB data)
```

## Dockerfile conventions

- Multi-stage: `builder` (compiles deps) → `runtime` (slim, copies artifacts).
- Run as a non-root user.
- Include a `HEALTHCHECK`.
- Keep a `.dockerignore` so build context stays small and secrets stay out.

## Gotchas

- Backend `.env` uses `MYSQL_HOST` / `REDIS_URL` with Docker service names
  (`redis`). Those names only resolve **inside** the compose network. Running
  the backend outside Docker requires `localhost` instead.
- `docker compose down -v` deletes the `mysql_data` volume — never run it
  against data you want to keep.
- PowerShell: `2>&1` on `docker` wraps stderr lines as errors even on success;
  read the actual output, not the wrapper noise.

## Checklist

- [ ] Image builds clean
- [ ] Container passes its HEALTHCHECK
- [ ] No secret baked into the image
- [ ] `.env.example` updated if env keys changed
