import type { ReactNode } from "react";

export interface FieldNoteProps {
  label?: string;
  children: ReactNode;
}

/**
 * A field-guide styled callout — the "logbook" register of the visual system.
 *
 * Tier 1: presentational, React-only, no framework or doc-tool imports (no
 * `next/*`, no `fumadocs-*`), so it renders unchanged on any React surface. The
 * brand accent reads straight from the design-token CSS var
 * (`--ot-color-brand`), so it stays correct under any per-project preset
 * without a rebuild.
 */
export function FieldNote({ label = "Field Note", children }: FieldNoteProps) {
  return (
    <aside
      className="my-4 rounded-md border border-l-4 px-4 py-3"
      style={{ borderLeftColor: "var(--ot-color-brand)" }}
    >
      <p
        className="mb-1 font-mono text-xs font-medium uppercase tracking-wide"
        style={{ color: "var(--ot-color-brand)" }}
      >
        {label}
      </p>
      <div className="text-sm">{children}</div>
    </aside>
  );
}
