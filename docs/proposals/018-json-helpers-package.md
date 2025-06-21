# ADR-0018: `@outfitter/json` — safe JSON parsing/stringifying

- **Status**: Proposed
- **Date**: 2025-06-20
- **Deciders**: Max

---

## Motivation

Every `JSON.parse` is a potential runtime throw; `JSON.stringify` can fail on BigInt or circular structures. Provide small helpers returning `Result`.

## API

```ts
export function safeParse(text: string): Result<unknown, AppError>;
export function safeParseWith<T>(text: string, schema: z.ZodSchema<T>): Result<T, AppError>;
export function safeStringify(value: unknown, space?: number): Result<string, AppError>;
```

`safeStringify` internally uses `fast-safe-stringify` to handle circular refs and BigInt to string conversion.

---
