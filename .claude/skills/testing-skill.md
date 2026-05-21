# Skill: Testing

A recipe for writing and running tests across the stack.

Used by: `qa-agent`.

## Backend — pytest

Layout under `backend/tests/`:
```
tests/
├── conftest.py     shared fixtures (client, db)
├── unit/           services, helpers — no DB, no network
├── integration/    repositories + endpoints — real DB
└── e2e/            full API flows
```

### Unit test — service in isolation

```python
def test_register_duplicate_email_raises_conflict(...):
    # arrange: a user already exists
    # act + assert
    with pytest.raises(ConflictError):
        AuthService(db).register(payload)
```

### Endpoint test — using the `client` fixture

```python
def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}
```

### Run

```powershell
docker compose exec backend pytest
docker compose exec backend pytest tests/unit -q
docker compose exec backend pytest -k auth
```

## Frontend — vitest

```powershell
docker compose exec frontend npm test
```

Test hooks and components with React Testing Library; mock `apiClient` so
tests do not hit the network.

## Conventions

- Name tests `test_<unit>_<condition>_<expected>`.
- One behaviour per test; clear arrange / act / assert sections.
- Prefer testing observable behaviour over implementation details.
- Integration tests use a real database — do not mock the DB layer, since
  mocked queries hide schema and migration drift.
- Keep unit tests free of I/O so they stay fast.

## Coverage targets

- `services/` and pure helpers: high unit coverage — that is where the
  business rules live.
- `repositories/` and endpoints: integration coverage for the main paths.
- Critical flows (auth, checkout, payment): an e2e test.

## Checklist

- [ ] New behaviour has a unit test
- [ ] Cross-layer behaviour has an integration test
- [ ] Test names describe condition + expected outcome
- [ ] All tests green locally
