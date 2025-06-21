# TypeScript: Loose to Strict Configuration Migration

This guide helps you migrate from a permissive TypeScript configuration to the strict settings used in @outfitter/typescript-config.

## Why Strict TypeScript?

Strict TypeScript catches bugs at compile time that would otherwise surface at runtime:

- Null pointer exceptions
- Undefined property access
- Implicit any types
- Unreachable code paths
- Array index out of bounds

## Migration Strategy

Instead of enabling all strict flags at once, migrate incrementally:

1. **Start with `strict: true`**
2. **Fix errors by priority** (security → runtime errors → code quality)
3. **Enable additional checks** one at a time
4. **Use temporary overrides** sparingly

## Step-by-Step Migration

### Step 1: Baseline Strict Mode

Start by extending the Outfitter config with some checks disabled:

```json
{
  "extends": "@outfitter/typescript-config/base",
  "compilerOptions": {
    // Temporarily disable the hardest checks
    "noUncheckedIndexedAccess": false,
    "exactOptionalPropertyTypes": false,
    "noPropertyAccessFromIndexSignature": false
  }
}
```

### Step 2: Fix Implicit Any

The most common initial errors come from implicit `any` types.

**Before:**

```typescript
// ❌ Parameter 'user' implicitly has an 'any' type
function greetUser(user) {
  return `Hello, ${user.name}!`;
}

// ❌ 'data' implicitly has an 'any' type
const processData = data => data.map(item => item.value);
```

**After:**

```typescript
// ✅ Explicit types
interface User {
  name: string;
}

function greetUser(user: User): string {
  return `Hello, ${user.name}!`;
}

// ✅ Generic type for flexibility
const processData = <T extends { value: unknown }>(data: T[]): unknown[] =>
  data.map(item => item.value);
```

### Step 3: Handle Null and Undefined

With `strictNullChecks`, TypeScript distinguishes between `null`, `undefined`, and other types.

**Before:**

```typescript
// ❌ Object is possibly 'undefined'
function getLength(str: string | undefined) {
  return str.length;
}

// ❌ Object is possibly 'null'
const config = getConfig();
console.log(config.apiUrl);
```

**After:**

```typescript
// ✅ Guard against undefined
function getLength(str: string | undefined): number {
  return str?.length ?? 0;
}

// ✅ Type narrowing
const config = getConfig();
if (config) {
  console.log(config.apiUrl);
}

// ✅ Non-null assertion (when you're certain)
const config = getConfig();
console.log(config!.apiUrl); // Use sparingly!
```

### Step 4: Fix Optional Property Access

With `exactOptionalPropertyTypes`, optional properties can't be explicitly set to `undefined`.

**Before:**

```typescript
interface Options {
  debug?: boolean;
}

// ❌ Type 'undefined' is not assignable to type 'boolean'
const opts: Options = {
  debug: undefined,
};
```

**After:**

```typescript
// ✅ Omit the property
const opts: Options = {};

// ✅ Or use union type if undefined is needed
interface Options {
  debug?: boolean | undefined;
}
```

### Step 5: Enable noUncheckedIndexedAccess

This is often the most challenging flag. It makes array and object index access return `T | undefined`.

**Before:**

```typescript
// ❌ Assumes array has elements
const firstUser = users[0];
console.log(firstUser.name); // Could crash!

// ❌ Assumes property exists
const value = config[key];
return value.toLowerCase();
```

**After:**

```typescript
// ✅ Check for existence
const firstUser = users[0];
if (firstUser) {
  console.log(firstUser.name);
}

// ✅ Use optional chaining
const value = config[key];
return value?.toLowerCase() ?? '';

// ✅ Type assertion when you're certain
const users: [User, ...User[]] = getUsersWithAtLeastOne();
const firstUser = users[0]; // Now TypeScript knows it exists
```

### Step 6: Fix Function Returns

With `noImplicitReturns`, all code paths must explicitly return.

**Before:**

```typescript
// ❌ Not all code paths return a value
function processValue(value: number) {
  if (value > 0) {
    return value * 2;
  }
  // Implicit undefined return
}
```

**After:**

```typescript
// ✅ Explicit return
function processValue(value: number): number | undefined {
  if (value > 0) {
    return value * 2;
  }
  return undefined;
}

// ✅ Or throw for invalid cases
function processValue(value: number): number {
  if (value > 0) {
    return value * 2;
  }
  throw new Error('Value must be positive');
}
```

## Common Patterns and Solutions

### Working with APIs

**Before:**

```typescript
// ❌ Trusting API responses
async function fetchUser(id: string) {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();
  return data.user; // Could be anything!
}
```

**After:**

```typescript
// ✅ Validate API responses
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

async function fetchUser(id: string) {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();

  // Runtime validation
  const user = UserSchema.parse(data.user);
  return user; // Now properly typed!
}
```

### Working with DOM

**Before:**

```typescript
// ❌ Assumes element exists
const button = document.querySelector('.submit-btn');
button.addEventListener('click', handleClick);
```

**After:**

```typescript
// ✅ Check for existence
const button = document.querySelector('.submit-btn');
if (button) {
  button.addEventListener('click', handleClick);
}

// ✅ Or assert with error handling
const button = document.querySelector('.submit-btn');
if (!button) {
  throw new Error('Submit button not found');
}
button.addEventListener('click', handleClick);
```

### Array Operations

**Before:**

```typescript
// ❌ Assumes array has elements
const numbers = [1, 2, 3];
const doubled = numbers.map((n, i) => n * numbers[i + 1]);
```

**After:**

```typescript
// ✅ Handle bounds safely
const numbers = [1, 2, 3];
const doubled = numbers.map((n, i) => {
  const next = numbers[i + 1];
  return next !== undefined ? n * next : n;
});

// ✅ Or use slice for pairs
const pairs = numbers.slice(0, -1).map((n, i) => n * numbers[i + 1]);
```

## Gradual Enforcement

For large codebases, use these techniques:

### 1. Per-File Overrides

```typescript
// @ts-expect-error - TODO: Fix implicit any types
function legacyFunction(data) {
  return data.value;
}
```

### 2. Separate Configs

```json
// tsconfig.json - Strict for new code
{
  "extends": "@outfitter/typescript-config/base",
  "include": ["src/**/*"],
  "exclude": ["src/legacy/**/*"]
}

// tsconfig.legacy.json - Looser for old code
{
  "extends": "@outfitter/typescript-config/base",
  "compilerOptions": {
    "strict": false
  },
  "include": ["src/legacy/**/*"]
}
```

### 3. Progressive Strictness

Track your progress:

```json
{
  "extends": "@outfitter/typescript-config/base",
  "compilerOptions": {
    // Phase 1: ✅ Complete
    "strict": true,

    // Phase 2: 🚧 In Progress
    "noUncheckedIndexedAccess": false,

    // Phase 3: 📅 Planned
    "exactOptionalPropertyTypes": false
  }
}
```

## Tools and Scripts

### Find Implicit Any

```bash
# Find all implicit any errors
npx tsc --noEmit --strict 2>&1 | grep "TS7006"
```

### Type Coverage

```bash
# Install type-coverage
npm install -D type-coverage

# Check coverage
npx type-coverage

# Aim for >95% type coverage
npx type-coverage --at-least 95
```

### Auto-fix Some Issues

```bash
# Add explicit any (then replace with proper types)
npx ts-migrate migrate src --explicit-any

# Add return types
npx ts-add-returns src/**/*.ts
```

## Best Practices

1. **Don't use `any` as an escape hatch** - Use `unknown` instead
2. **Avoid non-null assertions (`!`)** - Use proper type guards
3. **Enable checks incrementally** - Don't overwhelm the team
4. **Document type decisions** - Add comments for complex types
5. **Use type predicates** - For custom type guards
6. **Leverage discriminated unions** - For complex state

## When You're Done

Once you've fixed all issues, your tsconfig should simply be:

```json
{
  "extends": "@outfitter/typescript-config/base",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
```

Congratulations! Your code is now protected by TypeScript's full type safety.
