# Possible Packages for @outfitter/monorepo

> **Note:** This is a historical research document exploring potential packages for the monorepo. Some packages have been implemented (with variations), while others remain as future considerations.

## @outfitter/testing

> **Partial Implementation:** The monorepo uses Vitest for all packages with a root-level configuration. No separate testing package exists yet, but the standardization on Vitest aligns with this proposal. Playwright integration has not been implemented.

**Mission statement:** Deliver a zero-config testing toolkit for Outfitter projects, bundling TypeScript-friendly test frameworks (Vitest, Playwright) with sensible defaults for fast, typesafe testing.

**Why now?** The testing landscape has shifted in the past two years – Jest's dominance waned as it struggled with ESM modules and maintenance, prompting many teams to adopt Vitest for unit tests and Playwright for end-to-end tests. In 2024, developers noted that newer libraries were often ESM-only, making Jest setups painful. Meanwhile, Vitest (especially by v3 in 2025) reached near feature parity with Jest, and Node's native test runner emerged as an option for basic cases. This is an ideal time to standardize on a modern stack: Vitest for speedy in-memory unit tests, and Playwright for headless browser integration tests. A shared testing package captures this community momentum.

**Core API surface:** The package will expose config presets and utilities:

* **Vitest config** – e.g. a `defineConfig` export or a pre-made `vitest.config.ts` that our apps can import and extend. It would set up TypeScript path mapping, jsdom or Node environment, and include useful plugins (like happy-dom or test coverage).
* **Playwright setup** – perhaps a base `playwright.config.ts` with sane defaults (headless, baseURL, etc.) and maybe some custom matchers for Playwright.
* **Testing utilities** – e.g. custom vitest matchers or helpers (could be zero-runtime types or tiny functions) for common patterns in our code (like a helper to initialize test data or wrap a React component in providers).

Example **Core API code sketch** – a consumer's vitest config might look like:

```ts
import { defineConfig } from "vitest";
import { baseVitestConfig } from "@outfitter/testing";

export default defineConfig({
  ...baseVitestConfig,
  test: {
    ...baseVitestConfig.test,
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"]
  }
});
```

Where `baseVitestConfig` comes from our package. Similarly, a `basePlaywrightConfig` could be imported for E2E tests.

**Dependencies & size trade-offs:** This package's dependencies would be dev-only: likely pinning `vitest`, `@vitest/ui` (for watch mode), `playwright-core` (or the specific browsers as peer deps), and perhaps `@testing-library/dom` if we include DOM testing helpers. These can be sizable (Playwright in particular brings browser engines), but as devDependencies they don't ship to production. We might opt for a two-layer design: a **core** with just config and types (no heavy deps), and an **extension** that a user can opt into (like `@outfitter/testing-vitest` that actually depends on Vitest, and `@outfitter/testing-playwright` for Playwright). However, given the monorepo context and pnpm, it might be acceptable to include them in one package for simplicity. Tree-shaking is irrelevant here (test files aren't bundled), so size isn't a big issue except for install times.

**Example integration snippet:** A project would install `@outfitter/testing` as a dev dependency, along with Vitest/Playwright if not transitively installed. Then:

* For unit tests, add to `package.json` scripts: `"test": "vitest"` (Vitest will auto-read our provided config).
* In `vitest.config.ts`: as shown above, spread in `baseVitestConfig`.
* For E2E, similarly use `basePlaywrightConfig` if provided, and run via Playwright test runner.
* We could also supply a CLI, e.g. `outfitter-test`, that invokes Vitest with our config, to avoid any config file at all.

**Community Evidence:** In mid-2024, many Next.js developers advocated migrating from Jest to Vitest for better DX and ESM support, often pairing it with Playwright for end-to-end testing. Projects reported that Jest was "barely maintained" and struggled with ESM, whereas Vitest "runs like a metric billion times faster" in practice. This validates our choice to modernize the testing setup.

**Second-Order Effects & Risks:** Embracing Vitest means relying on the Vite ecosystem for testing. This generally yields speed benefits, but there's a risk: Vitest is still evolving (e.g., turning off test isolation for speed as a recommendation in some cases). We must watch for upstream changes – e.g., Vitest 4 or 5 might introduce breaking config changes. Another risk is **fragmentation**: by abstracting the config, devs might not learn the underlying tools. We should document how our defaults map to Vitest/Playwright options so teams can override when needed. Vendor lock-in here is low (Vitest and Playwright are open-source and widely used), but if Node's native test runner becomes as powerful, we might reevaluate in the future. Performance-wise, the benefits (cached browser context, parallel threads via Vite) should outweigh any minor overhead of our abstraction.

**Quick Win v0.1 Tasks:**

* Create a `vitest.config.ts` preset exporting our recommended settings (coverage thresholds, transformers for TS/JSX, etc.).
* Do the same for `playwright.config.ts` (e.g. use Chromium by default, workers = number of CPUs).
* Provide a couple of utility functions or global setup (like a test initializer that loads environment variables, or extends Chai matchers).
* Test the package by converting one existing app's tests to use it (ensure tests run and coverage is collected).
* Configure CI to run `pnpm test` at the root, using Vitest's workspace support to run all tests with one command (Vitest supports monorepos with a root config).

## @outfitter/logger

**Mission statement:** Offer a lightweight, unified logging solution that works seamlessly in Node, browsers, and edge runtimes – with compile-time opt-out for client code and structured output on the server.

**Why now?** Modern applications span multiple environments (Next.js server, browser client, Cloudflare Workers, etc.), and each has different logging needs. In 2025, there's a growing expectation for **structured logging** in production systems for observability, yet front-end code should avoid bloating bundles with heavy logger libraries. The community has gravitated toward either minimal log utilities or highly optimized loggers like Pino for backend. For example, the `loglevel` library demonstrates the appeal of a minimal logger that adapts to Node and browser with the same API. We want to encapsulate that pattern: a zero-dependency core that defaults to `console` logging, with the ability to plug in more advanced transports in Node.

**Core API surface:** The logger package will likely export a logger instance or factory. For example:

```ts
import { Logger } from "@outfitter/logger";

export const log = new Logger({ level: "info" });
log.info("Server started", { port });
log.debug(() => `Detailed info: ${expensiveCalculation()}`);
```

Key aspects of the API:

* **Log levels** (debug, info, warn, error) with methods for each.
* Supports interpolation or lazy evaluation (e.g. passing a function to `log.debug` so that expensive messages don't evaluate if debug is off).
* In Node, the logger could be configured to output JSON (for integration with log aggregators) or colorized text during development.
* In browser, it might just proxy to `console.log` and friends (with perhaps a prefix or styling).
* **No global state by default** – allow creating separate logger instances (e.g. one per subsystem) but also export a default singleton (`logger`) for convenience.

**Dependencies & size trade-offs:** The core will aim for zero runtime dependencies (no heavy libs like Winston). It might include TypeScript types for log methods, but implementation can use `console` (which is built-in). This means the package itself is tiny. If advanced features are needed (e.g. pretty-printing, log file rotation, remote transport), we'd implement a plugin system: for instance, `@outfitter/logger-pino` could wrap Pino under the same interface. But the base package should remain minimal to avoid ballooning client bundle size. A nice side effect: tree-shaking or dead-code elimination can drop logging calls in production if we design it such that, say, `log.debug` is no-op depending on environment. We could provide a compile-time flag (like `process.env.LOG_LEVEL`) that tools can use to strip out lower-level calls.

**Example integration snippet:** In a Next.js app, one might do:

```ts
// util/log.ts
import { Logger } from "@outfitter/logger";
export const log = new Logger({ level: process.env.NODE_ENV === "production" ? "warn" : "debug" });
```

Then use `log` throughout. In a Cloudflare Worker, using the same API:

```ts
import { Logger } from "@outfitter/logger";
const log = new Logger({ level: "info", formatter: "json" });
log.info("Function triggered", { requestId });
```

On the client-side, if imported, it would default to sending logs to `console` (or no-op for certain levels if configured). Because the design is ESM-first, bundlers can tree-shake any branch that isn't used (for instance, if we separate Node-specific formatting code behind an import that won't be pulled into browser builds).

**Community Evidence:** Logging libraries in 2025 range from heavy-duty (Winston, Pino) to lightweight (loglevel). A 2025 guide notes that *"loglevel provides consistent logging across environments… Its API works the same on both server and client, adapting automatically"*, making it ideal for universal apps. This validates our approach to use a minimal core logger that can run anywhere.

**Second-Order Effects & Risks:** A unified logger simplifies life (one API to learn) but can introduce **performance costs** if not careful. For example, building a JSON log object for every request in a high-traffic service might be slow – we should allow skipping JSON stringification unless needed. There's also a risk of **vendor lock-in** if we abstract too much: if a team wants to swap in a different logger, our Logger should either wrap that or allow easy export of logs to it. We mitigate this by designing extensibility (e.g. allowing a custom "transport" function to be injected). Another consideration is future breakage: if console APIs or environment globals change (like workers might not have `console` exactly, though they do), we need to adapt. We should test in Node 20+, modern browsers, and Cloudflare Worker runtime to ensure compatibility.

**Quick Win v0.1 Tasks:**

* Implement `Logger` class with basic level filtering and console binding.
* Support a simple JSON formatter option (maybe using `JSON.stringify` unless a custom replacer is provided).
* Set default log level based on environment (e.g. debug in development, info in production).
* Write unit tests to simulate usage in Node vs browser (e.g. monkey-patch a global `window.console` in a test to verify it prints).
* Document how to disable logging in production builds (e.g. using a Babel plugin or terser to drop `log.debug` calls if needed).

## @outfitter/trpc-core

**Mission statement:** Centralize the heart of our type-safe API layer, defining server/client contracts (procedures, routers, context) in one reusable package so that multiple services and apps can share and extend a common RPC schema.

**Why now?** tRPC has matured into a stable foundation for typesafe APIs. By 2025, it's reached v11 with improved Next.js integration (e.g. seamless React Server Component support) and gained adoption in large projects (700k+ weekly downloads). The community is also navigating how tRPC coexists with Next.js's new Server Actions. Notably, developers have observed that using tRPC decouples your business logic from Next-specific APIs, offering future flexibility: *"Your app most likely won't live forever in Next.js. You can just move your tRPC logic to Express or whatever... If you stick with server actions, you'd have to depend on Next's abstractions"*. This sentiment underlines why a standalone tRPC core is valuable now – it future-proofs our backend logic and avoids framework lock-in.

**Core API surface:** This package will wrap **tRPC server** functionality:

* Export our `AppRouter` (or a function to create it) that aggregates all procedures. For instance, it might provide `initTRPC` configured with our common middlewares (like auth, rate-limiter stubs).
* Define and export reusable **procedures** and **middleware**. e.g. `publicProcedure`, `protectedProcedure` (if we have auth context), so that downstream apps can use these to build their routers.
* Possibly export **client types** or helpers (though tRPC usually generates a client from the router type, we might export a pre-configured client factory for convenience).

Example code sketch:

```ts
// In @outfitter/trpc-core
import { initTRPC } from "@trpc/server";
import superjson from "superjson";

const t = initTRPC.context<OutfitterContext>().create({ transformer: superjson });
export const router = t.router;
export const publicProcedure = t.procedure;
export type AppRouter = typeof appRouter;  // appRouter defined in implementing app
```

This core package might not itself define all endpoints (since those could live in each app), but it provides the building blocks (common transformers, error formatting, etc.). In some cases, we could include some **shared procedures** if multiple apps need them (for example, a health check or a user profile procedure that is common).

**Dependencies & size trade-offs:** It will depend on `@trpc/server` (ESM-ready) and likely on `zod` (or a similar schema library) if we use it for input validation in procedures. These add some runtime weight on the server side, but since this package is primarily used on the server (and tRPC client code is generated separately or via `@trpc/client`), it doesn't affect client bundle much except for whatever minimal types or stubs leak to client. We might also include `superjson` as a dependency if we want richer data transfer (for dates, etc.). Overall, tRPC is fairly lightweight – most overhead is in validation (Zod) which is optional. By splitting core (types & server wrappers) from any integration (like Next.js API route handlers), we ensure no unnecessary code is bundled into clients.

**Example integration snippet:**
In a Next.js API route file (or Next 13 route handler):

```ts
import { appRouter, createContext } from "@outfitter/trpc-core/adapter-next"; 
// (the adapter-next export could provide a Next.js compatible handler)
 
export const POST = appRouter.createNextRouteHandler({ createContext });
```

This shows how an app would plug its router into Next's routing. Another example: in a Cloudflare Worker, we might use a different adapter:

```ts
import { fetchHandler } from "@outfitter/trpc-core/adapter-fetch";
export default { fetch: (req) => fetchHandler(req, createContext) };
```

The core package can provide these adapters or we might put them in `@outfitter/next` and `@outfitter/worker-kit` respectively. The key integration is that any service can import the shared procedures and router definitions, so both our Next app and, say, a microservice can implement the same contract.

**Community Evidence:** The t3 stack community has demonstrated combining Next.js and tRPC effectively in monorepos. For example, a widely referenced template by tRPC maintainers shows best practices for Next + tRPC + Expo monorepo setups. Moreover, industry adoption is high – tRPC's stability and large contributor base signal it's a safe choice. Developers on Reddit affirmed in late 2024 that tRPC is "very stable and mature, and still active" even if it's not making hype headlines, further indicating that building on tRPC now is a sound long-term bet.

**Second-Order Effects & Risks:** Using tRPC heavily means our server and client are tightly coupled via TypeScript types. This is great for developer experience, but it's a form of **schema lock-in** – changes to APIs must be managed carefully to avoid breaking clients. We should implement versioning or at least communicate changes (perhaps via automated tests against client code). Another risk is **framework evolution**: Next.js is pushing Server Actions (an alternative to tRPC for some use cases). It's possible that in the future, Next could introduce first-class RPC-like facilities or the ecosystem might pivot to something like gRPC or GraphQL Federation depending on needs. By isolating tRPC in its own package, we at least contain this implementation so we could swap it out if needed (for example, replace tRPC v11 with a hypothetical v12 or even an alternative RPC library) without touching app code everywhere. Performance-wise, tRPC adds minimal overhead (function calls and optional validations), but we should monitor it – e.g. if we start doing heavy runtime validation with Zod, that could slow things down; in such cases, we might consider lighter validators or turning off server-side validation in production for hot paths. Lastly, as we integrate with edge runtimes (Workers), we need to ensure tRPC's HTTP handling (which is designed for Node) is compatible or use polyfills/adapter (the community is exploring this, and our Worker kit can facilitate it).

**Quick Win v0.1 Tasks:**

* Set up `initTRPC` in this package with our default transformers and middlewares.
* Define a dummy `exampleRouter` with a couple of procedures (for documentation/testing).
* Export Next.js adapter: possibly using `@trpc/server/adapters/next` to create a Next API handler quickly.
* Write docs on how to extend the `router` in an application (showing an app-specific router that merges in core procedures if any).
* Ensure ESM-only: no `require()` – use import/export everywhere, and test in a pure ESM environment.
* If feasible, add a script to generate OpenAPI schema or type documentation from the router (could be a nice bonus for devs, using something like `trpc-openapi` later).

## @outfitter/next

**Mission statement:** Streamline Next.js application setup and integration in the monorepo by packaging shared configurations, utilities, and conventions (especially for App Router, tRPC, environment variables, etc.) into one toolkit.

**Why now?** Next.js has undergone major changes with the App Router (released in Next 13 and stabilized in Next 14). By late 2024, Next 14 brought significant advancements making routing more modular and performance-driven, and features like **Server Actions** became stable (allowing form submissions and mutations directly from React components). Our organization has multiple Next-powered apps; it's the right time to encode our collective Next.js knowledge into a reusable package. Moreover, with Next's rapid evolution (Next 15 on the horizon), having a central package makes it easier to upgrade all apps together (e.g. adjust to any breaking changes in a single place).

**Core API surface:** This package will likely export:

* **Next.js config** helpers: e.g. a `withOutfitterNext` function that wraps Next's config. For example:

  ```js
  // next.config.js
  const { withOutfitterNext } = require("@outfitter/next");
  module.exports = withOutfitterNext({
    reactStrictMode: true,
    transpilePackages: ["@outfitter/*"]
  });
  ```

  This could apply custom webpack or experimental settings (like enabling `turbo` bundler, or configuring SVGR, etc.) that we want consistent.
* **App Router utilities**: Perhaps a set of conventions for layouts or page initialization. For instance, a custom `Document` or `_app` (in pages router) if any common behavior is needed, or a `<OutfitterAppShell>` component wrapping the App Router layout to inject providers (theme, state).
* **tRPC integration**: If our tRPC core defines the router, `@outfitter/next` can supply the Next.js API route handler. For example, `withTRPCNext()` could create a Next.js API route from our `appRouter`. This avoids each app writing boilerplate to hook tRPC into Next.
* **Env integration**: It might tie in with `@outfitter/env-client` to preload certain environment variables at build time (for example, injecting public env variables via Next's `publicRuntimeConfig` or using Next 13's `env` options when they exist).

Additionally, we might include **Next-specific polyfills or shims** – e.g. if we want to ensure Biome formatting runs on build or certain ESLint rules are auto-included (though Biome is separate, not ESLint).

**Dependencies & size trade-offs:** This package will have `next` as a peer dependency (we won't bundle Next itself). It may depend on some Next plugins or tools (for example, if we use `@next/eslint-plugin` or `next-sitemap` we might include those as optional). At runtime, its weight is low – mostly configuration and maybe a couple of small helper components. The risk of including heavy dependencies is minimal here, since most heavy lifting is within Next's framework. We should remain mindful to keep it ESM-only and not pull in Node-only code that breaks the Next build (Next itself is fine with both ESM and CJS, but we prefer ESM).

**Example integration snippet:** As shown, the simplest use is in **next.config.js**. Another example: in an App Router project:

```tsx
// app/layout.tsx
import { OutfitterProviders } from "@outfitter/next";
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <OutfitterProviders>{children}</OutfitterProviders>
      </body>
    </html>
  );
}
```

Where `OutfitterProviders` might set up context like ThemeProvider, QueryClientProvider for tRPC/TanStack Query, etc., according to our stack's needs. This avoids duplicating that setup across apps.

If we provide a tRPC handler:

```ts
// app/api/trpc/[trpc]/route.ts (Next 13 App Router API route)
import { createNextRouteHandler } from "@outfitter/next";
import { appRouter } from "@outfitter/trpc-core";
export const { GET, POST } = createNextRouteHandler(appRouter);
```

This hypothetical helper would internally call `appRouter.createCaller` or use tRPC's Next adapter.

**Community Evidence:** The Next.js community in 2024 emphasizes leveraging the new App Router for scalability. A guide on Next.js 14 noted that mastering the App Router's features (layouts, streaming, etc.) is *"essential for creating efficient and scalable applications"*. By building those best practices into our package (e.g. encouraging proper use of layouts and parallel routes), we align with the state-of-the-art. Additionally, Next's own release blog for v14 highlighted improvements like stable Server Actions and huge dev server performance boosts – our package can help teams adopt those by default (for instance, enabling the experimental `turbo` bundler, or showing how to use Server Actions safely alongside tRPC).

**Second-Order Effects & Risks:** One risk is that Next.js can be a moving target. If we abstract too much, an upstream change (say Next 15 introducing a new routing concept) might require a significant refactor of this package, and apps would be abstracted away from Next's docs – we must maintain good documentation so developers know what this package is doing. There's also a risk of **limited flexibility**: apps might have unique needs that our defaults don't cover, so we need to allow escape hatches. For example, `withOutfitterNext(config, overrideOptions)` should allow opting out of certain presets. Vendor lock-in isn't a major concern since this package is internal to our monorepo and just wraps Next (which we're already "locked into" for those apps). Performance-wise, any config we add (like Webpack plugins or React wrappers) should be evaluated for overhead. We should be cautious not to enable Next features that add bundle size or runtime cost without good reason (e.g., don't force Polyfills or heavy analytics scripts; those should be opt-in).

**Quick Win v0.1 Tasks:**

* Implement `withOutfitterNext`: start with enabling `experimental.appDir` (if using App Router), ensuring our monorepo packages are transpiled (Next doesn't transpile node\_modules by default, so include `@outfitter/*` in transpilePackages).
* Provide a `<OutfitterProviders>` component that wraps children with context providers (this can import things like our theme, TanStack Query provider configured for tRPC caching, etc.).
* Set up a demo Next app in the repo to test these utilities in development.
* If using Server Actions alongside tRPC, document how to choose one or use them together (could be in README – e.g., recommend tRPC for complex calls, Server Actions for simple form submits).
* Write an example of a Next 13 route handler that uses our tRPC adapter, as a reference for app developers.

## @outfitter/worker-kit

**Mission statement:** Equip our codebase to run in edge and worker environments (Node worker threads, Cloudflare Workers, Vercel Edge Functions, etc.) by providing adapters and utilities that abstract away environment specifics (timers, fetch, etc.) and facilitate code reuse across these contexts.

**Why now?** Edge computing and multithreaded workers are increasingly important from 2024 into 2025. Cloudflare Workers, for example, saw a surge of improvements in late 2024 – including broader Node.js API compatibility (so more npm packages "just work" on Workers). This makes it feasible to share code between a Node server and a Cloudflare Worker without many modifications. Additionally, Node's built-in Worker Threads have stabilized, and use cases like background job processing or parallel CPU work in Node are common. Our monorepo could benefit from a unified "worker kit" that handles these scenarios. By creating this package now, we ride the wave of recent platform updates: Cloudflare's October 2024 Builder Day shipped features to deploy Next.js to Workers (via OpenNext) and use Node APIs in Workers, signaling that running our code at the edge (close to users, or in parallel threads) is more attainable than ever.

**Core API surface:** Depending on use case, it will have a few facets:

* **Cloudflare Worker adapter:** e.g. an export like `createWorkerRouter` or `handleFetch` that ties into Cloudflare's `event.respondWith` model. For instance:

  ```ts
  import { handleFetch } from "@outfitter/worker-kit/cloudflare";
  import { appRouter } from "@outfitter/trpc-core";
  export default {
    fetch: (request, env, ctx) => handleFetch(request, env, ctx, appRouter)
  };
  ```

  This could wrap our tRPC router (or any request handler) to respond to HTTP requests in the Worker context.
* **Node Worker Threads helper:** e.g. a function to spawn a worker thread easily with type-safe messaging. For example, `runInWorker(func, data) -> Promise<result>` that under the hood creates a Worker thread (using a data blob or file) and returns the result. This abstracts the `new Worker(new URL(..., import.meta.url))` boilerplate and messaging protocol.
* **Environment polyfills:** Some globals differ between environments. We might export a unified `timers` or `fetch` so that code can import from `@outfitter/worker-kit` instead of assuming a global. For example, if running in Node 18, `fetch` wasn't global by default, but we could provide one (Node 20 has fetch global though, which aligns with Cloudflare's fetch).
* **Utility for Cron or scheduled jobs:** Cloudflare Workers allow scheduled triggers. We could expose a convention for scheduled tasks (maybe a simple registry where the worker script can call a function on schedule events).

Essentially, this package acts as a bridge between our **runtime-agnostic core logic** and the **specific worker environments**. It might be split internally (like subpath imports for cloudflare vs node), to avoid bundling irrelevant code.

**Dependencies & size trade-offs:** We will be careful to keep this lean. For Cloudflare, we likely use the minimal workers API (no heavy libs required, Cloudflare's runtime provides fetch, crypto, etc.). For Node worker threads, the Node built-in `worker_threads` module is used – no extra deps. If we include any polyfills or small libraries (perhaps a structured clone polyfill or a small message validation), we'd keep them tiny. The biggest dependency could be something like a fetch polyfill for Node <18, but since we target Node 20+, we might not need that. We should also be mindful that code for Cloudflare should not include Node-specific modules (like `fs`), and vice versa, to avoid bundling issues. Size isn't a huge concern for server code, but for Cloudflare Workers, there is a size limit per script (currently \~1MB compressed). Our kit should add virtually nothing significant on top of tRPC and any user code.

**Example integration snippet:** Cloudflare Worker usage:

```ts
// worker.js (entry for Cloudflare Worker build)
import { createFetchHandler } from "@outfitter/worker-kit/cloudflare";
import { appRouter } from "@outfitter/trpc-core";
import { createContext } from "./context"; // custom context for tRPC

export default {
  fetch: createFetchHandler(appRouter, createContext)
};
```

This would produce a `fetch` listener that routes requests to tRPC procedures. For Node worker threads:

```ts
// main-thread code
import { runJob } from "@outfitter/worker-kit/node";

const result = await runJob("./heavyTask.js", { some: "data" });
// heavyTask.js would be a module that processes the data and returns result.
```

Inside `runJob`, we handle spawning the worker thread and returning a promise.

**Community Evidence:** Cloudflare's developer updates in 2024 emphasize making their Workers dev-friendly – e.g. *"Use a wider set of NPM packages on Cloudflare Workers, via improved Node.js compatibility"*. This indicates that writing isomorphic code (that runs on Node or on Workers) is more feasible than before. Additionally, frameworks like Astro, Remix, and even Next (via OpenNext) have been targeting Cloudflare and other edge platforms, suggesting a general push towards edge-first design. Our worker-kit rides that trend by ensuring our tools (like tRPC or logging) work in those environments with minimal fuss.

**Second-Order Effects & Risks:** One potential risk is **platform dependency**: if we abstract Cloudflare Worker details, we might inadvertently lock ourselves to Cloudflare's model. We should design abstractions that could work on other edge runtimes too (like Deno Deploy or Vercel Edge, which also use Web Fetch API). The kit should remain fairly thin to reduce maintenance – if Cloudflare updates their runtime (they often do, e.g. adding native TCP sockets or such), we might need to update our adapters. Another risk is debugging complexity: adding a layer between the environment and our code can make debugging harder when something goes wrong on the edge. We'll mitigate by allowing easy opt-out or verbose logging in development. Performance-wise, our abstractions should add negligible overhead (e.g., our `fetch` handler might wrap request parsing in a try-catch, but that's minimal). The benefits of easier code reuse and fewer bugs (from not duplicating code for different envs) likely outweigh the thin wrapper cost.

**Quick Win v0.1 Tasks:**

* Implement a basic `fetch` request handler for Cloudflare: parse the request URL and body, call `appRouter` (perhaps using tRPC's `resolveHTTPResponse` under the hood) and return a Response.
* Test the Cloudflare handler by deploying a small Worker with a couple of tRPC routes – ensure it works with real HTTP requests.
* Implement a simple `runJob` for Node worker threads: using dynamic import of a worker script and setting up `parentPort` messaging. Also consider a convenience to run inline functions (though that might require bundling – maybe v0.2).
* Provide documentation or examples for using these – e.g. how to bundle a Cloudflare Worker (maybe using `wrangler` or a Vite plugin).
* If possible, add a detection in our logger or env packages to adapt to Workers (for example, `@outfitter/logger` could use our kit to determine that `console` is the only sink available in a Worker and disable color codes). This cross-package synergy can be tested in this phase.

## @outfitter/ci

> **Partial Implementation:** The monorepo uses GitHub Actions with pnpm and turbo caching strategies. No separate CI package exists, but the caching and parallelization patterns described here are implemented in `.github/workflows/`.

**Mission statement:** Define a standard Continuous Integration toolkit for the monorepo, including shareable pipelines and scripts to consistently lint, test, build, and deploy all packages with maximum efficiency (leveraging caching and parallelism in a Turborepo setup).

**Why now?** Our monorepo is growing, and fast CI feedback is crucial. In the 2024–2025 timeframe, monorepo-oriented CI strategies have become quite sophisticated – for instance, caching build artifacts to avoid redundant work, and running tasks only for affected packages. Tools like Turborepo (now under Vercel) and Nx are widely used to cut CI times. There's evidence that with clever use of caching and parallelism, teams have slashed CI times from tens of minutes to mere minutes. We want to institutionalize those gains. Also, the introduction of Node 20+ and pnpm means our CI can use the latest features (like corepack, better concurrency). By creating a dedicated CI package, we can version control our workflow templates and helper scripts instead of duplicating YAML across repos or pipeline definitions.

**Core API surface:** This package will not be imported by application code, but rather used in our CI configuration (GitHub Actions, etc.). It can provide:

* **Reusable workflow templates or action definitions**: For GitHub Actions, we might write JavaScript actions or reusable YAML workflows here, then reference them in the repo's `.github/workflows/*.yml`. For example, an action `ci-cache-turbo` that sets up caching for Turborepo.
* **CLI commands**: Possibly a small CLI (like `outfitter-ci`) that can run common tasks with proper flags. For instance, a script to run `pnpm install` in all workspaces, or to run `turbo run build --cache-dir=...` with our standardized settings. This could abstract away CI specifics (so switching from GitHub to another CI would be easier).
* **Configuration**: e.g. a central place for defining which tasks should run on PR vs main branch, etc. This might just be documentation or scripts that are invoked by CI YAML.

For example, the package might include a shell or Node script for setting up the pnpm store and turbo cache:

```bash
# ci-setup.sh (provided by @outfitter/ci)
pnpm install --frozen-lockfile
pnpm turbo run build --cache-dir=.cache/turbo
```

and our GitHub Actions YAML would call this script.

Alternatively, using JavaScript:

```ts
// In a GitHub Action step via uses: outfitter/ci/action-setup@v1
// This action (packaged here) could restore caches and run pnpm etc.
```

**Dependencies & size trade-offs:** This package may depend on `turbo` and `pnpm` (as devDependencies or peer, to ensure the versions used in CI match dev). Possibly also `@actions/core` if we write a custom GitHub Action. These dependencies don't ship to production, they only run in CI runners. The size of the package isn't a concern in the usual sense, but we do want it lean for maintainability. Most logic can be simple scripts.

**Example integration snippet:** In a GitHub Actions workflow file, after checking out code:

```yaml
- uses: actions/cache@v3
  with:
    path: ~/.pnpm-store
    key: monorepo-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
- uses: actions/cache@v3
  with:
    path: .cache/turbo
    key: monorepo-turbo-${{ github.sha }}
- name: Install and Build
  run: npx outfitter-ci install-and-build
```

Here, `outfitter-ci install-and-build` could be a CLI provided by our package that handles pnpm install and running turbo with appropriate flags (including restoring caches). The use of caching keys is crucial: we will document recommended cache key strategies (like hashing lockfile for pnpm cache, using commit SHA for build cache with fallback to branch, etc.). Projects have shown enormous speed improvements using such caching.

**Community Evidence:** A 2023 case study (edited in 2024) described reducing a monorepo's deployment pipeline from 26 minutes to 1 minute by switching to pnpm and Turborepo with aggressive caching. Techniques included caching the pnpm store and using a GitHub Action to enable Turborepo's remote cache within GitHub Actions. This confirms that our focus – caching and parallel builds – is the right approach for fast CI.

**Second-Order Effects & Risks:** Centralizing CI config means any mistake propagates to all pipelines – we need to test changes in a safe environment. There's also a learning curve: developers must understand that CI behavior is driven by this package (which is unusual). We should clearly document in the repo README how CI is configured and how to update it via this package. Another risk is coupling to specific CI providers (we currently likely use GitHub Actions). If we ever migrate to, say, GitLab or CircleCI, our package would need to adapt (perhaps by providing equivalent scripts without the GitHub-specific caching, or by using a more provider-agnostic approach like just shell scripts). We can mitigate this by keeping most logic in scripts that can run anywhere, and only small bits in provider-specific syntax. Performance-wise, there's little risk: the whole point is to improve performance. One caution is to avoid overly aggressive caching that could lead to stale artifacts (we should ensure cache keys include relevant hashes so that, for example, a code change triggers rebuild and doesn't reuse an outdated cache). Also, using Turborepo's caching means we must be vigilant that all tasks are truly deterministic given the inputs; if not, cache might cause flaky builds.

**Quick Win v0.1 Tasks:**

* Write a script to set up PNPM on a CI runner (e.g. installing pnpm via corepack or npm). Although GitHub Actions offers `actions/setup-node` with pnpm support, we can encapsulate the steps.
* Add a script for caching: maybe leveraging `turbo run print-affected` to only run needed builds/tests (or simply rely on turbo's built-in incremental logic).
* Provide a basic reusable GitHub Actions workflow YAML in the package (actions allows `uses: ./.github/workflows/xxx.yml@ref` but since our monorepo holds it, we might just document it).
* Test the CI pipeline on a sample branch to ensure cache hits are happening (perhaps intentionally re-run a workflow to see speed gain).
* Integrate Biome formatting and Vitest tests into the pipeline via this package's scripts, so that `outfitter-ci` can run "verify" (lint + test) easily. For example, `outfitter-ci verify` runs `pnpm biome check && pnpm turbo run test`. This ensures consistency across projects.

## @outfitter/env-client

**Mission statement:** Provide a safe, convenient way to manage environment variables in our applications – ensuring type-checked access to variables on both server and client, and preventing accidental exposure of secrets to the browser.

**Why now?** As our stack has grown, so has the number of environment configs (API keys, feature flags, etc.). In 2024, there's been a push for **type-safe environment variables** using libraries like Zod and community solutions (e.g. the t3 stack's env-nextjs) to avoid runtime errors due to misconfiguration. Manually using `process.env` is error-prone: values are strings and may be missing, which can lead to crashes that are hard to debug. By mid-2024, many projects adopted patterns to validate env vars at startup and generate TypeScript types for them. Next.js also has conventions (`NEXT_PUBLIC_` prefix) for exposing env vars to front-end. Our package will formalize these practices: validate on the server, strip or expose as needed on client.

**Core API surface:** Likely, we'll offer:

* **Schema definition** – perhaps a default Zod schema for expected env vars, or a function to create one. For instance:

  ```ts
  // env.mjs in an app
  import { defineEnv } from "@outfitter/env-client";
  export const env = defineEnv({
    NEXT_PUBLIC_API_URL: { type: "string", required: true },
    NODE_ENV: { type: "enum", values: ["development","production","test"], default: "development" }
  });
  ```

  Under the hood, `defineEnv` could use Zod (or a simpler custom parser) to validate `process.env` at runtime and throw with a clear message if something's missing or invalid.
* **Type extraction** – The result of `defineEnv` would be a typed object `env` with properties correctly typed (e.g. `env.NEXT_PUBLIC_API_URL` is string).
* **Client-side usage** – For variables meant to be public, Next.js will embed them at build time. We might provide a helper for non-Next apps (like if we had a pure web app) to inject a subset of env vars into client code (maybe via Vite define plugin, configured through this package).
* Possibly a utility to load `.env` files in development (similar to dotenv, but Next does this automatically; Node scripts might need it though).
* Security: we might enforce that any variable not prefixed with `NEXT_PUBLIC_` is not exposed by our library on the client side. Perhaps `defineEnv` can separate the schema into private vs public and we export different objects for server vs client.

**Dependencies & size trade-offs:** We will use `zod` (or similar) as a dependency for validation, which is \~ >100KB but only used at startup (and tree-shakable if not used). That's acceptable given the benefits. The code we run on client will be minimal – ideally just an object of values (no heavy logic, since validation would have run on server build). We should also consider using Node's built-in `process.env` for server values and not polyfill that on client (Next.js replaces process.env.\* at build time for known public vars). So at build, the client bundle might literally have `{"NEXT_PUBLIC_API_URL":"https://prod.api.com"}` in it. Our package could generate that via a small script.

**Example integration snippet:** In a Next.js application:

```ts
// lib/env.ts
import { clientEnv, serverEnv } from "@outfitter/env-client";

// Access validated variables
export const API_URL = clientEnv.NEXT_PUBLIC_API_URL;
export const NODE_ENV = serverEnv.NODE_ENV;
```

If we design it differently: maybe `import { env } from "@outfitter/env-client"` which yields a unified object where in the browser only the public keys exist (others maybe undefined or a Proxy that throws). But likely better to separate for clarity.

An example of definition:

```ts
// Inside @outfitter/env-client (could be auto-run)
import { z } from "zod";
const EnvSchema = z.object({
  NODE_ENV: z.enum(["development","test","production"]).default("production"),
  NEXT_PUBLIC_API_URL: z.string().url()
  // ...other vars
});
const _env = EnvSchema.parse(process.env);
export const serverEnv = _env;
export const clientEnv = {
  NEXT_PUBLIC_API_URL: _env.NEXT_PUBLIC_API_URL
};
```

Then apps use `clientEnv` or `serverEnv`. This way, misconfiguration throws early during app startup, and developers get a clear error message about which var is missing or invalid.

**Community Evidence:** It's become common to use Zod for env validation. A January 2024 blog notes that using Zod can "validate that all required environment variables are set and automatically get types for them… and switching between `process.env` and `import.meta.env` involves just a single change". In the t3 stack, a dedicated library (`env-nextjs`) was created to enforce these rules. Our approach follows this well-trodden path, bringing those community solutions in-house for our needs.

**Second-Order Effects & Risks:** One risk is that by abstracting env access, newcomers might be confused compared to vanilla `process.env`. We should document usage clearly (and even generate a failure message that says "Add missing vars to .env or Vercel dashboard" etc.). Also, if an env var changes or is added, we need to update the schema – forgetting to do so will cause either a runtime error (if the var is required and we didn't add it) or an undefined var that our types don't know about. We can mitigate by making the schema easy to extend and perhaps logging a warning for unknown vars (so if someone adds a new env key in the cloud, our code could detect it's not in schema and warn). **Security** is a big consideration: we must ensure that no secret (like API keys meant for server only) ever appears in `clientEnv`. Our design with explicit `NEXT_PUBLIC_` prefix follows Next.js conventions to avoid that mistake. Future Next.js features might introduce new ways to supply env (for example, app router allows passing env to RSC), but we can adapt when that comes. Performance-wise, the validation is done once at startup – negligible cost compared to the pain of debugging a missing env at runtime. The package itself has no runtime loop or such, it's straightforward.

**Quick Win v0.1 Tasks:**

* Implement a default schema covering common env vars we use (NODE\_ENV, perhaps API URLs, etc.) – or better, allow apps to pass in a schema extension (so the package isn't rigid).
* Throw clear errors on validation failure (maybe use colors/red text for visibility in console).
* Expose `clientEnv` and `serverEnv` objects.
* Test in a Next.js dev build and production build to ensure that client bundle does not include any server-only vars.
* Provide docs: e.g. "To add a new env var, update EnvSchema in env-client package and ensure to prefix with NEXT\_PUBLIC\_ if it's needed in frontend." Possibly also integrate with our scaffolding CLI to prompt for adding new env keys.
* If using Node scripts (like a Node CLI tool in our repo), consider using this package to load `.env` and validate for those too (ensuring our scripts also have required configs).

## @outfitter/nextra-theme

**Mission statement:** Deliver a branded documentation theme for our docs site (and any similar content sites), based on Nextra's extensible docs theme, so that all our documentation has a consistent, polished look with minimal effort.

**Why now?** We maintain docs (perhaps for an SDK or internal guides) and currently use Nextra, a Next.js-based static site generator for documentation. Nextra has an official theme with search, navigation, etc. – by 2024 it has become a go-to for many open-source docs due to its simplicity. As of 2024, Nextra's docs theme supports the Next.js App Router and has nearly all features needed out-of-the-box. However, we likely want custom styling (colors, logos) or slight layout tweaks to match Outfitter's branding. Instead of hacking the theme per project, we can fork/extend it once in a shared package. Nextra's theming system allows using a custom theme package, so the timing is right to create our own as our docs needs mature. Also, by mid-2025, the Nextra ecosystem should be stable (v2 or v3 of Nextra theme), reducing churn in our custom version.

**Core API surface:** This is primarily an **MDX/React theme**. It will export the components and config that Nextra expects:

* Likely we provide a `theme.config.jsx` template and a set of React components for layout: e.g. `Logo`, `Head`, `Navbar`, `Sidebar` overrides.
* We might re-export Nextra's defaults and just override some pieces (for example, Nextra's docs theme provides `<NavLink>`, `<ThemeSwitch>`, etc. — we could use them or replace them).
* Developers using our theme will set `theme: "@outfitter/nextra-theme"` in their Nextra config, and our package will internally call `nextra-theme-docs` with our modifications.

This means our package needs to be consumed at build time by Next/Nextra. We should ensure it's ESM and compatible with how Nextra loads themes (which is usually by package name resolution).

We can also expose configuration options via our theme's `theme.config.js`. For instance, Outfitter theme might allow toggling certain features:

```jsx
// theme.config.jsx in a docs project
import { defineThemeConfig } from "@outfitter/nextra-theme";

export default defineThemeConfig({
  logo: <span>Outfitter Docs</span>,
  primaryColor: "#FF6600",
  // ...other options
});
```

Under the hood, `defineThemeConfig` might just return the object, but could validate it or apply defaults. We'll merge those into Nextra's config.

**Dependencies & size trade-offs:** We will depend on `nextra` and `nextra-theme-docs` (the official theme) as peer or direct dependencies to leverage their components. These bring in some CSS (Tailwind) and minimal JS for search and theme switching. The size is moderate – but since this is used in a static site, the main concern is client bundle of the docs site, which is acceptable given Nextra is optimized for content sites. We might also pull in a search library (Nextra uses Algolia DocSearch or a lightweight client-side search). Our modifications (CSS or images for branding) will be small. We should avoid overly heavy scripts; the goal is mostly stylistic and structural customization. Because it's ESM and built on Next, no special bundler issues are expected.

**Example integration snippet:** In the documentation project's `next.config.mjs`:

```js
const withNextra = require("nextra")({
  theme: "@outfitter/nextra-theme",
  themeConfig: "./theme.config.jsx"
});
module.exports = withNextra({});
```

This tells Next to use our theme. Then the `theme.config.jsx` would use our provided types/options as shown. The content authors can then focus on writing `.mdx` files; our theme will automatically provide the layout, styling, and components (like callout boxes, etc.).

If we extended a component, say the default sidebar, we'd include that in our package and Nextra will use it when rendering.

**Community Evidence:** Nextra's official docs theme is known to include essentially everything needed for modern docs sites (mobile-responsive sidebar, search, dark mode, etc.). Many companies build custom looks on top of it. In late 2024, Nextra released updates (v3+ and "app-router" compatibility), indicating the theme system is stable enough for extension. Our creation of a custom theme mirrors what others have done to incorporate unique branding while benefiting from Nextra's solid foundation.

**Second-Order Effects & Risks:** By introducing a custom theme, we assume responsibility for maintaining compatibility with Nextra/Next upgrades. If Nextra changes its internal APIs or layout structure, we'll need to update our theme accordingly. The risk is mitigated by the fact that Nextra is quite popular and likely to follow semantic versioning – we can pin a compatible version and test when upgrading. Another risk is limited flexibility for docs writers: if someone wants to diverge from our theme (say, add a custom footer), they'd have to either request a change here or override it in their project, which can be hacky. We should document how to do minor customizations (perhaps via the `theme.config` we expose, like allowing custom footer text or extra links). Performance-wise, the theme mostly affects build time and static rendering; it shouldn't degrade runtime performance beyond what Nextra already does. One consideration: search. If we integrate something like Algolia DocSearch, we need to ensure not to leak keys or we provide configuration for it. Also, if our docs site is deployed on platforms like Vercel or Cloudflare, our theme should be tested there for any SSR issues.

**Quick Win v0.1 Tasks:**

* Scaffold the theme by starting with Nextra's example theme. Copy the default `nextra-theme-docs` components into our package and change styling (e.g. apply Outfitter brand colors, logo).
* Implement `defineThemeConfig` to allow projects to easily supply their logo and other preferences.
* Test the theme by creating a dummy docs site (maybe for this very monorepo or a sub-package) using our theme, verify that all components render (sidebar, prev/next links, code blocks, etc.).
* Ensure dark mode toggle, search, and other interactive parts work. If we need an Algolia API key for DocSearch, set it via `theme.config`.
* Optimize any assets (if we include a logo SVG or so).
* Write usage instructions: developers should simply install `@outfitter/nextra-theme` and set it in nextra config, plus provide a `theme.config.jsx` as needed.

## @outfitter/create (scaffolder CLI)

> **Partial Implementation:** A CLI exists as `outfitter` (not @outfitter/cli) but lacks scaffolding features. It has commands for supplies management but no project/package generation capabilities yet.

**Mission statement:** Provide a one-command scaffolding tool to bootstrap new projects or packages in our ecosystem with best practices and latest Outfitter presets – essentially our custom "create-app" CLI for rapid, consistent project setup.

**Why now?** The idea of stack-specific CLIs has taken off – notably, *create-t3-app* in 2022-2023 made waves as an easy way to start a typesafe Next.js project. By 2025, even large companies (e.g. Zoom for their reference apps) have embraced the T3 stack or similar because it streamlines setup. Internally, as we plan to spin up multiple services (maybe a new micro-frontend or a new backend service), having to copy-paste configs or remember all steps is inefficient and error-prone. A scaffolder ensures new projects have the correct ts-config, testing setup, CI config, etc., from day one. With all the shared packages we're defining, now is the perfect time to wrap them into templates. Also, Node 20+ and pnpm are fairly standard now, simplifying our CLI (no need to support old Node or other package managers as much). In short, we have a clear stack, and the community expects quick bootstrap tools – providing our own will boost productivity and consistency.

**Core API surface:** The CLI likely runs via `npm create outfitter@latest` or `pnpm dlx @outfitter/create`. It will present an interactive prompt (using something like Inquirer or prompts) asking:

* What type of project? (Options: "Next.js app", "Cloudflare Worker service", "Shared library/package", etc. We can map these to templates.)
* Name of the project, maybe other details (like choose a CSS framework or database, if we want to incorporate those).
  Then it will generate files and run install.

We can package it similarly to other create-xx-app CLIs, possibly as a single executable script (with a dependency on degit or using `create-t3-app`'s approach of pulling template from repo). Perhaps simplest is bundling a few template folders within the package and copying them.

For example:

```
$ npm create outfitter@latest my-new-app
# prompts:
# √ Project type? (Next.js App)
# √ Package name: my-new-app
# √ Use example content? (yes)
# -> scaffolding...
```

It generates `my-new-app/` with:

* A Next.js project that already has `@outfitter/ts-config`, `@outfitter/testing`, etc. installed and configured.
* Basic pages or API routes if relevant.
* Possibly a GitHub Actions workflow file using `@outfitter/ci` template.

For a library, maybe:

```
$ pnpm dlx @outfitter/create package utils/date-fns
```

This could scaffold a new package under `packages/utils/date-fns` in the monorepo with boilerplate (tsconfig.json extends our base, index.ts, maybe a sample test).

**Dependencies & size trade-offs:** The CLI will depend on a few things like a prompting library and possibly something to fetch latest versions of templates if not bundled. We might bundle templates in the package for now (makes it a bit larger, but it's fine since it's one-time use primarily). We should avoid huge deps; many modern CLIs just use light dependencies thanks to ESM and top-level await for simplicity. We'll definitely use ESM (Node 20 supports it well). The CLI's size isn't a big issue (even if it's a couple of MB with templates), as it's not a runtime dependency. One decision: do we embed the templates or fetch from a git repo? Embedding ensures the CLI version and template align and works offline; fetching could allow updating templates without a new release. Perhaps embed for now for reliability (like create-react-app does with an internal tarball).

**Example integration snippet:** Running the CLI:

```bash
npx @outfitter/create@latest my-service --type worker
```

This could scaffold a Cloudflare Worker project. Another usage: we could integrate it with our monorepo tooling, e.g., `pnpm create outfitter package <name>` to add a new package to the monorepo (injecting it into `pnpm-workspace.yaml` etc.). That might require the CLI to detect it's running in an existing monorepo context and adjust behavior.

If interactive, a snippet of the prompt code:

```ts
const answers = await prompts([
  { name: 'projName', type: 'text', message: 'Package/app name?' },
  { name: 'variant', type: 'select', message: 'What do you want to create?', choices: [...] }
]);
```

Then based on answers, copy template folder and do string replacements for name.

**Community Evidence:** The efficacy of such tools is evident from the T3 Stack's popularity – "the quickest way to start a new full-stack, typesafe app". Even Zoom's dev team wrote about choosing the T3 stack (Next.js + tRPC + Prisma, which is exactly what we use) for its modern DX. Our own create-outfitter CLI will similarly streamline starting a project with our chosen stack, reducing setup time and ensuring no steps are missed (like adding the correct CI workflow or environment setup).

**Second-Order Effects & Risks:** If the CLI is too rigid, developers might feel constrained or may not use it for non-standard projects. We should perhaps allow an "empty" option or make it easy to modify the output. Another risk: the templates could get stale as our shared packages evolve. We must update the CLI's templates whenever packages (like `@outfitter/next` or others) get major updates, or else new projects will start with outdated patterns. This requires a maintenance commitment and good versioning (maybe tie CLI version to a stack release version). Vendor lock-in is low (it's our internal tool), but we are effectively "locking in" to our stack – which is intentional. Performance isn't really a concern here, except that scaffolding should be quick (under a few seconds plus install time). One minor risk: if a user runs it inside an existing git repo or folder, we should avoid overwriting files accidentally – so include checks or require confirmation.

**Quick Win v0.1 Tasks:**

* Set up the CLI command with bin in package.json (`"bin": { "create-outfitter": "dist/index.cjs" }` for example) – though we prefer ESM, Node can handle that by spawning a loader.
* Implement prompt logic for at least two scenarios: "app" vs "package".
* Prepare template files:

  * For Next.js app: a Next 14 project with our config (tsconfig extends @outfitter/ts-config, uses our next theme for docs maybe or at least `@outfitter/next` integration, `@outfitter/env-client` for env, etc., plus maybe a simple page and API route).
  * For a shared package: minimal TypeScript library setup (src/index.ts, test/demo.test.ts, vitest config, package.json with proper name and references).
* Test running the CLI locally on different inputs.
* Integrate with our monorepo: we could even use it to scaffold its own example to make sure it works. Possibly add an E2E test for the CLI (spawn it in a temp dir, ensure the output compiles).
* Ensure the license/copyright and naming are properly applied in templates (e.g., use the project name in package.json).
* Write documentation: in our repo README or wiki, explain how to use `create-outfitter` for new projects.

## Dependency Graph

Below is a dependency graph illustrating how these new `@outfitter/*` packages relate to each other and to existing usage in our stack:

```mermaid
flowchart LR
    subgraph DevTooling
        testing["@outfitter/testing"]
        ci["@outfitter/ci"]
    end
    subgraph Runtime
        logger["@outfitter/logger"]
        trpc["@outfitter/trpc-core"]
        env["@outfitter/env-client"]
        nextpkg["@outfitter/next"]
        worker["@outfitter/worker-kit"]
        nextra["@outfitter/nextra-theme"]
    end
    create["@outfitter/create"]
    
    %% Runtime usage
    nextpkg --> trpc      %% Next package uses trpc-core (e.g. to create API routes)
    nextpkg --> env       %% Next uses env-client to handle public env vars
    nextpkg --> logger    %% Next apps will use logger (for server logs)
    worker --> trpc       %% Worker kit may use tRPC core for RPC handling in edge
    worker --> env        %% Workers might use env-client (though fewer env vars likely)
    worker --> logger     %% Workers use logger for console logging
    nextra --> nextpkg    %% Nextra theme is essentially a Next.js app/plugin
    
    %% The create CLI scaffolds projects with various packages:
    create --> testing
    create --> logger
    create --> trpc
    create --> nextpkg
    create --> worker
    create --> env
    create --> ci  %% (includes CI workflow templates)
    create --> nextra %% (it can scaffold a docs site with our theme)
```

*Notation:* An arrow `A --> B` means **A uses or depends on B**. For example, `nextpkg --> trpc` indicates `@outfitter/next` incorporates `@outfitter/trpc-core` functionality. The **DevTooling** subgraph groups packages mainly used at development or CI time, while **Runtime** groups those that become part of application runtime (client or server). The scaffolder `@outfitter/create` ties everything together by generating new projects that include the other packages as needed.