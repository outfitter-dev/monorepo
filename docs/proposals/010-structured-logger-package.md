# ADR-0010: Introduce `@outfitter/logger` — structured, type-safe logging

- **Status**: Proposed
- **Date**: 2025-06-20
- **Deciders**: Max

---

## Context and Problem Statement

We currently rely on `console.log` (or ad-hoc wrappers) across packages. This lacks:

* consistent JSON structure — hurting log aggregation in Loki / Elastic.
* correlation-id propagation — makes tracing multi-service flows hard.
* typed log-level enumeration — typos silently fail.
* standard serialisation of `AppError`, `Result`, `RemoteData`.

## Decision Drivers

1. **Operational insight**: logs must be machine-parseable.
2. **DX**: ergonomic API that encourages context-rich logging.
3. **Compatibility**: works in Node and browser, tree-shakable.

## Proposed Solution

Create a thin wrapper around _pino_ (well-maintained, high-perf) exposing a minimal surface suited to our needs.

```ts
// packages/logger/src/index.ts

export const enum LogLevel {
  Trace = 'trace',
  Debug = 'debug',
  Info  = 'info',
  Warn  = 'warn',
  Error = 'error',
  Fatal = 'fatal',
}

export interface Logger {
  child(context: Record<string, unknown>): Logger;

  trace(msg: string, fields?: Record<string, unknown>): void;
  debug(msg: string, fields?: Record<string, unknown>): void;
  info (msg: string, fields?: Record<string, unknown>): void;
  warn (msg: string, fields?: Record<string, unknown>): void;
  error(msg: string | AppError, fields?: Record<string, unknown>): void;
  fatal(msg: string | AppError, fields?: Record<string, unknown>): void;
}

export function getLogger(): Logger; // root logger
```

### Key features

* **JSON-only** output, no colour codes (better for cloud).
* Automatically serialises `AppError`, `Result`, `RemoteData` into flat JSON.
* `withContext(requestId)` returns a child logger with `requestId` on every line.
* Compile-time removal of `trace`/`debug` in production via ts-transform or dead-code elimination (`process.env.NODE_ENV==='production'`).

## Impact

* Uniform log shape across CLI, backend, React SSR layer.
* Simplifies dashboards, alerts.

## Migration

Search-&-replace codemod converts `console.*` → logger calls.

---
