# ADR-0019: `@outfitter/tracing` — OpenTelemetry instrumentation

- **Status**: Proposed
- **Date**: 2025-06-20
- **Deciders**: Max

---

## Objective

Ensure every service and tool emits distributed traces and metrics with minimal boilerplate.

## Approach

- Wrap OpenTelemetry SDK.
- Autoinstrumentations: HTTP, Fetch, Pg, Redis.
- Provide `withSpan` helper compatible with `AsyncResult`:

```ts
export async function withSpan<T, E>(
  name: string,
  fn: () => AsyncResult<T,E>,
): AsyncResult<T,E>;
```

- Integrates with `@outfitter/logger` (traceId field).

## Configuration

Uses `@outfitter/config` to pick exporter (stdout, OTLP gRPC, etc.).

---
