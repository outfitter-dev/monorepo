# ADR-0014: `@outfitter/id` — canonical identifier utilities

- **Status**: Proposed
- **Date**: 2025-06-20
- **Deciders**: Max

---

## Objective

Ensure all IDs (ULID, UUID, Snowflake) share validation, parsing and brand types to prevent mix-ups.

## Scope

- `Ulid` brand, `createUlid()` (uses `ulid` package) and `parseUlid()`.
- `Uuid` already present in contracts; will re-export here.
- `ShortId` (7-char base62) for URLs.

## API

```ts
export type Ulid = Brand<string,'Ulid'>;

export function createUlid(): Ulid;
export function parseUlid(str:string): Result<Ulid,AppError>;

export type ShortId = Brand<string,'ShortId'>;
export function createShortId(): ShortId;
```

## Usage

```ts
const orderId = createUlid();
db.insert({ id: orderId });

match(parseUlid(raw),
  (ok)=> service.handle(ok),
  (err)=> reply.status(400).send(err)
);
```

---
