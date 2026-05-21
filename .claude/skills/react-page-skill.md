# Skill: React Page / Feature

A recipe for adding a new page or feature slice to the React frontend,
following the feature-sliced structure.

Used by: `frontend-agent`.

## When to use

A new screen or piece of UI functionality is needed
(e.g. a checkout page, an order-history view, a product filter).

## Decide: page-only or full feature?

- **Page-only** (composes existing features): just add to `pages/`.
- **Full feature** (new data + state): add a slice under `features/`.

## Steps — full feature

### 1. Feature slice — `frontend/src/features/<name>/`

```
features/<name>/
├── api.js          API calls via apiClient
├── hooks.js        React Query hooks wrapping api.js
├── store.js        Zustand store — only if client state is needed
└── components/     feature-specific components
```

**api.js**
```js
import { apiClient } from '@/services/apiClient.js';

export const <name>Api = {
  list: (params) => apiClient.get('/<name>', { params }).then(r => r.data),
  get:  (id)     => apiClient.get(`/<name>/${id}`).then(r => r.data),
};
```

**hooks.js**
```js
import { useQuery } from '@tanstack/react-query';
import { <name>Api } from './api.js';

export function use<Name>(id) {
  return useQuery({ queryKey: ['<name>', id], queryFn: () => <name>Api.get(id) });
}
```

### 2. Page — `frontend/src/pages/<Name>Page.jsx`

Consume the hook; handle `isLoading` and `error` states.

```jsx
export default function <Name>Page() {
  const { data, isLoading, error } = use<Name>();
  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>Something went wrong.</p>;
  return ( /* render data */ );
}
```

### 3. Route — `frontend/src/app/App.jsx`

```jsx
<Route path="/<name>" element={<<Name>Page />} />
```

Add a nav link in `components/layout/Layout.jsx` if user-facing.

### 4. Verify

`npm run dev`, open the route, confirm loading / data / error states.
The Vite proxy forwards `/api` to the backend on `localhost:8000`.

## Rules

- All HTTP goes through `apiClient` — never raw `axios`/`fetch`.
- Server data → React Query. Client/UI state → Zustand. No duplication.
- Import with the `@/` alias.
- Keep components presentational; data logic lives in `hooks.js`.

## Checklist

- [ ] Feature slice created (api / hooks / store as needed)
- [ ] Page handles loading + error + empty states
- [ ] Route registered, nav link added if needed
- [ ] Verified in the browser against a running backend
