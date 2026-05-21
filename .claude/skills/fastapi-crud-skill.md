# Skill: FastAPI CRUD Resource

A step-by-step recipe for adding a new CRUD resource to the backend, end to
end, while respecting the `api → service → repository → model` architecture.

Used by: `db-agent`, `backend-agent`.

## When to use

A new business entity needs persistence and an HTTP API
(e.g. `Review`, `Coupon`, `Address`).

## Steps

### 1. Model — `backend/app/models/<entity>.py`  (db-agent)

```python
from app.models.base import Base, IDMixin, TimestampMixin

class <Entity>(Base, IDMixin, TimestampMixin):
    __tablename__ = "<entities>"
    # Mapped[...] columns; index FKs and filter columns
```

Register it in `app/db/base.py` and `app/models/__init__.py`.

### 2. Migration  (db-agent)

```powershell
docker run --rm --env-file ./backend/.env -v ${PWD}/backend:/app -w /app ecom-backend alembic revision --autogenerate -m "add <entities>"
docker run --rm --env-file ./backend/.env -v ${PWD}/backend:/app -w /app ecom-backend alembic upgrade head
```

Review the generated file before applying.

### 3. Schemas — `backend/app/schemas/<entity>.py`

Define `<Entity>Create`, `<Entity>Update`, `<Entity>Read`.
`Read` uses `ConfigDict(from_attributes=True)`.

### 4. Repository — `backend/app/repositories/<entity>_repository.py`

```python
from app.repositories.base import BaseRepository
from app.models.<entity> import <Entity>

class <Entity>Repository(BaseRepository[<Entity>]):
    model = <Entity>
    # add custom queries (get_by_*, search) here
```

### 5. Service — `backend/app/services/<entity>_service.py`

Holds business rules. Owns the transaction (`db.commit()`).
Raises `NotFoundError` / `ConflictError` from `app/core/exceptions.py`.

### 6. Endpoints — `backend/app/api/v1/endpoints/<entities>.py`

Thin handlers: validate, call one service method, return a schema.
Protect writes with `Depends(get_current_user)` or `Depends(require_admin)`.

### 7. Register the router — `backend/app/api/v1/router.py`

```python
api_router.include_router(<entities>.router, prefix="/<entities>", tags=["<entities>"])
```

### 8. Verify

Check `/docs`, then probe each verb with `Invoke-RestMethod`.

## Checklist

- [ ] Model registered in `db/base.py`
- [ ] Migration generated, reviewed, applied
- [ ] Schemas: Create / Update / Read
- [ ] Repository extends `BaseRepository`
- [ ] Service owns rules + transaction, raises typed errors
- [ ] Endpoints thin, auth applied, router registered
- [ ] No ORM access outside the repository
- [ ] Endpoints visible in `/docs` and smoke-tested
