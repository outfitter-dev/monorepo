# ADR-0012: `@outfitter/http` — typed, resilient HTTP client

- **Status**: Proposed
- **Date**: 2025-06-20
- **Deciders**: Max

---

## Problem

`fetch` is ubiquitous but offers no retries, timeouts, tracing or type-safety. We need a lightweight wrapper that fits the contracts eco-system and produces `AsyncResult<T,AppError>`.

## Key Requirements

1. Same API in Node and browser (ponyfill of `fetch`).
2. Automatic JSON serialisation / deserialisation with Zod validation.
3. Retry with exponential back-off, configurable.
4. Timeout and abort controller.
5. Inject correlation-id header from `@outfitter/logger` scope.
6. First-class tracing via `@outfitter/tracing`.

## API Sketch

```ts
interface HttpOptions<U> {
  method?: 'GET'|'POST'|'PUT'|'PATCH'|'DELETE';
  headers?: Record<string,string>;
  body?: U;
  schema?: z.ZodSchema<unknown>;  // for response validation
  timeoutMs?: number;
  retries?: number;               // default 2
}

export function request<T = unknown, U = unknown>(
  url: string,
  options?: HttpOptions<U>,
): AsyncResult<T, AppError>;

export const get  = <T>(url:string, opts?: Omit<HttpOptions<never>, 'method'|'body'>) => request<T>(url,{...opts,method:'GET'});
export const post = <T,U>(url:string, body:U, opts?: Omit<HttpOptions<U>,'method'|'body'>) => request<T,U>(url,{...opts,method:'POST',body});
```

## Error Mapping

* network failure → `EXTERNAL_SERVICE_ERROR`
* 4xx → `NOT_FOUND` `FORBIDDEN` `UNAUTHORIZED` `CONFLICT` etc.
* 5xx → `EXTERNAL_SERVICE_ERROR`

## Implementation Notes

* Internally uses `undici` in Node for performance.
* Body encoding: if `body` is object ⇒ `JSON.stringify` with header.
* Streaming left for a future extension.

---
