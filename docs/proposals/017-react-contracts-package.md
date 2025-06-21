# ADR-0017: `@outfitter/react-contracts` — React hooks & boundaries for contracts primitives

- **Status**: Proposed
- **Date**: 2025-06-20
- **Deciders**: Max

---

## Purpose

Provide minimal, headless React helpers that integrate `Option`, `Result`, `AsyncResult`, and `RemoteData` with Suspense & ErrorBoundary.

## Deliverables

1. **`suspend` helper** *(see ADR-0009)*.
2. **`useAsyncResult` hook**

```ts
function useAsyncResult<T, E>(fn: () => AsyncResult<T,E>, deps: unknown[]): RemoteData<T,E>
```

3. **`ResultBoundary` component**

```tsx
<ResultBoundary
  onError={(e)=> log.error(e)}
  fallback={<ErrorPage />}
>
  <UserProfile />
</ResultBoundary>
```

Internally wraps `ErrorBoundary` and converts thrown `AppError` to UI.

4. **`Loading` / `Error` primitives** (tiny components with default styling)

## Non-goals

* UI styling — projects may wrap components with Chakra / Tailwind.
* State management — leave to Zustand, Redux, etc.

---
