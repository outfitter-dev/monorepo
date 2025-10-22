# @outfitter/validation

Shared validation utilities for the Outfitter ecosystem. This package wraps Zod with
registry, diagnostics, and JSON Schema helpers so every project can deliver
consistent, actionable validation errors.

## Features

- Schema registry with lazy lookup and result-based validation
- Diagnostics helpers that translate Zod issues into Outfitter-friendly structures
- JSON Schema generation for docs and tooling
- Environment validation helpers built on the same diagnostic pipeline

## Usage

```ts
import {
  createSchemaRegistry,
  validateWithDiagnostics,
  generateJsonSchema,
  createEnvValidator,
} from "@outfitter/validation";
import { z } from "zod";

const registry = createSchemaRegistry();
const UserSchema = z.object({ id: z.string().uuid(), email: z.string().email() });
registry.register("user", UserSchema);

const result = registry.validate("user", { id: "abc", email: "foo" });
if (!result.ok) {
  console.error(result.error.diagnostics);
}

const jsonSchema = generateJsonSchema(UserSchema, { name: "User" });

const env = createEnvValidator(
  z.object({ DATABASE_URL: z.string().url() })
);
```

## License

MIT © Outfitter
