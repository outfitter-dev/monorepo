---
slug: when-to-extract-package
title: When to extract code into a package
description: Guidelines for identifying when code should be extracted into a standalone package in a monorepo.
type: convention
---

# When to Extract a Package

Knowing when to extract code into a separate package is crucial for maintaining a healthy monorepo architecture. This guide provides concrete criteria and patterns for making these decisions.

## The Extraction Decision Framework

### 1. The Rule of Three

**Don't extract until you have three consumers**

The most common mistake is premature extraction. Wait until:

- Three different apps/packages need the same code
- The duplication is causing actual maintenance burden
- The shared API has stabilized through real usage

**Example**:

```typescript
// ❌ Premature extraction - only used in one place
packages/
  user-avatar/  // Only used by web app

// ✅ Ready for extraction - multiple consumers
packages/
  user-avatar/  // Used by web, mobile, and admin apps
```

### 2. Clear Domain Boundaries

**Extract when code represents a distinct domain**

Good candidates:

- **Authentication logic** - Clear boundaries, multiple consumers
- **Data formatting utilities** - Pure functions, widely useful
- **Design system components** - Visual consistency across apps
- **API clients** - Centralized endpoint management

Poor candidates:

- **App-specific business logic** - Tightly coupled to one app
- **One-off utilities** - Too specific to generalize
- **Temporary abstractions** - Still evolving rapidly

### 3. Independent Release Cycles

**Extract when version independence matters**

Consider extraction when:

- The code has its own semantic versioning needs
- External projects might consume it
- Breaking changes need careful management
- Multiple major versions must be supported

**Example scenario**: Your date formatting library is used by both your current apps and legacy systems that can't upgrade immediately.

## Extraction Patterns

### Pattern 1: UI Component Library

**When to extract**:

- ✅ Components used in 3+ applications
- ✅ Design system established
- ✅ Clear component API boundaries
- ✅ Dedicated design/UX ownership

**Structure**:

```
packages/ui/
  src/
    components/
      Button/
        Button.tsx
        Button.test.tsx
        Button.stories.tsx
      Card/
      Input/
    theme/
    utils/
  package.json
```

**Key indicators**:

- Designers reference component names
- "Can we use the same button as..." conversations
- Copy-paste happening between apps

### Pattern 2: Shared Business Logic

**When to extract**:

- ✅ Core calculations used everywhere
- ✅ Domain rules that must be consistent
- ✅ Logic has stabilized
- ✅ Clear input/output contracts

**Example**:

```typescript
// packages/pricing/src/index.ts
export function calculateDiscount(
  items: LineItem[],
  customer: Customer,
  promos: Promotion[]
): DiscountResult {
  // Complex business logic that must be consistent
}
```

**Key indicators**:

- Business logic being duplicated
- Fear of logic getting out of sync
- Domain experts define the rules

### Pattern 3: Infrastructure Utilities

**When to extract**:

- ✅ Multiple services need same infrastructure
- ✅ Configuration complexity warrants abstraction
- ✅ Team expertise can be centralized
- ✅ Security/compliance requirements

**Examples**:

- Logging with correlation IDs
- Metrics collection
- Error tracking integration
- Feature flag clients

### Pattern 4: Type Definitions

**When to extract**:

- ✅ Types shared between frontend/backend
- ✅ API contracts need enforcement
- ✅ Multiple consumers need type safety
- ✅ Types represent stable domain models

**Structure**:

```typescript
// packages/types/src/index.ts
export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface ApiResponse<T> {
  data: T;
  error?: ApiError;
  metadata: ResponseMetadata;
}
```

## Anti-Patterns to Avoid

### The Utils Dumping Ground

❌ **Don't create catch-all utility packages**

```text
packages/
  utils/          # Bad: becomes a junk drawer
    strings.ts    # Random string functions
    dates.ts      # Random date functions
    misc.ts       # ???
```

✅ **Do create focused packages**

```text
packages/
  date-fns/       # Good: clear purpose
  validation/     # Good: cohesive domain
  formatters/     # Good: related utilities
```

### The Premature Abstraction

❌ **Don't extract "just in case"**

Signs of premature extraction:

- "We might need this elsewhere someday"
- Only one consumer exists
- API changes with every use
- Heavy configuration to work everywhere

### The Kitchen Sink Component

❌ **Don't create overly configurable components**

```typescript
// Bad: Too many responsibilities
<SuperForm
  mode="wizard"
  validation={schema}
  styling="material"
  submitBehavior="ajax"
  layout="horizontal"
  errorDisplay="inline"
  fieldTypes={customTypes}
  // ... 20 more props
/>
```

✅ **Do create composable components**

```typescript
// Good: Focused, composable
<Form onSubmit={handleSubmit}>
  <FormField name="email" validate={emailValidator}>
    <TextInput type="email" />
    <FieldError />
  </FormField>
</Form>
```

## Extraction Process

### Step 1: Identify Candidates

Look for:

- Code copied between projects
- Imports reaching across app boundaries
- "It would be nice if..." conversations
- Shared configuration or constants

### Step 2: Design the API

Before extracting:

- Document the intended API
- Consider all current use cases
- Plan for reasonable flexibility
- Get feedback from consumers

### Step 3: Create the Package

```bash
# Create package structure
mkdir packages/new-package
cd packages/new-package

# Initialize
pnpm init

# Set up base configuration
cp ../other-package/tsconfig.json .
cp ../other-package/vitest.config.ts .
```

### Step 4: Migrate Gradually

1. Create package with extracted code
2. Add package dependency to one consumer
3. Replace old code with package import
4. Test thoroughly
5. Repeat for other consumers
6. Remove duplicated code

### Step 5: Document and Communicate

- Add comprehensive README
- Document migration path
- Update architecture diagrams
- Notify teams of new package

## Maintenance Considerations

### When to Merge Packages

Consider merging when:

- Packages always change together
- Import cycles develop
- Artificial boundaries create friction
- Single team owns both packages

### When to Split Packages

Consider splitting when:

- Package serves multiple unrelated purposes
- Different parts have different dependencies
- Teams want separate ownership
- Performance impacts from unused code

### Version Management

For extracted packages:

- Follow semantic versioning strictly
- Document breaking changes clearly
- Consider supporting multiple major versions
- Use changesets for version management

## Decision Checklist

Before extracting a package, answer:

- [ ] Do at least 3 consumers need this code?
- [ ] Has the API stabilized through real usage?
- [ ] Does it represent a clear domain or concern?
- [ ] Can it be tested independently?
- [ ] Is there a clear owner/team?
- [ ] Will extraction reduce overall complexity?
- [ ] Are the boundaries unlikely to change?

If you answered "no" to any of these, reconsider extraction.

## Real-World Examples

### Successful Extractions

**Design System** → `@company/ui`

- Started with 3 apps sharing components
- Clear ownership by design team
- Stable component APIs
- Storybook documentation

**API Client** → `@company/api-client`

- All apps needed same endpoints
- Type safety crucial
- Version locked to API version
- Generated from OpenAPI spec

**Analytics** → `@company/analytics`

- Multiple apps tracked events
- Consistent event schemas needed
- Privacy compliance centralized
- A/B testing infrastructure shared

### Failed Extractions

**"Common" Utils** → Deleted

- Grab bag of unrelated functions
- No clear ownership
- Each app used different parts
- Became a dumping ground

**Super Form Component** → Split up

- Tried to handle every form case
- 50+ props
- Impossible to maintain
- Split into focused components

**Business Logic "Core"** → Merged back

- Premature extraction
- Only one app actually used it
- Slowed down development
- Merged back into app

## Conclusion

Package extraction is a powerful tool for code organization, but it's not free. Every package adds complexity, maintenance burden, and cognitive overhead.

Extract packages when:

- Multiple consumers genuinely need shared code
- Clear boundaries exist
- The benefits outweigh the costs

Keep code in apps when:

- It's truly app-specific
- Still evolving rapidly
- Complexity would increase

The best monorepo has exactly as many packages as needed - no more, no less.
