# @outfitter/validation

## 1.0.0

Initial stable release of @outfitter/validation.

### Features

- Schema registry pattern with `createSchemaRegistry()` for centralized validation management
- Result-based validation with `validateWithDiagnostics()` returning structured diagnostic data
- JSON Schema generation via `generateJsonSchema()` for documentation and tooling integration
- Environment validation helper `createEnvValidator()` with flexible env source support
- Diagnostic to AppError conversion with `diagnosticsToAppError()` for integration with @outfitter/contracts
- Structured validation diagnostics with paths, messages, codes, and severity levels
- Warning vs error severity inference from Zod custom issues
- Comprehensive README documentation with examples, API reference, and best practices
- 41 tests covering core functionality, edge cases, and Result pattern integration

## 0.1.0

- Add schema registry, diagnostics, JSON Schema generation, and environment validation helpers.
- Provide first-class Result-based APIs for Zod validation across the platform.
