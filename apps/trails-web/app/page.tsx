import { FieldNote, NavItem } from "@outfitter/ui";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1
        className="font-mono text-3xl font-semibold"
        style={{ color: "var(--ot-color-brand)" }}
      >
        Trails
      </h1>
      <p className="text-fd-muted-foreground">
        Agent-native, contract-first TypeScript. Define a trail once with typed
        input, a <code>Result</code> output, examples, and meta — then surface
        it on CLI, MCP, HTTP, or a plain library call.
      </p>

      <FieldNote label="Scaffold">
        This site is the first consumer of the Outfitter web platform. This very
        callout is an <code>@outfitter/ui</code> Tier 1 component, styled from
        Tier 0 design tokens, rendered at the Next app edge.
      </FieldNote>

      <nav className="flex gap-4 text-sm">
        {/* The framework-primitive seam: next/link injected into a portable
            Tier 1 component that defaults to a plain anchor elsewhere. */}
        <NavItem
          href="/docs"
          LinkComponent={Link}
          className="font-medium underline underline-offset-4"
        >
          Read the docs →
        </NavItem>
      </nav>
    </main>
  );
}
