/**
 * Outfitter design tokens — the single source of truth for the design system,
 * authored as a plain TypeScript object so any runtime (Bun, Node, browser,
 * edge) can consume them. `scripts/build-css.ts` projects this object into
 * `tokens.css` (`:root` custom properties) for the styling layer.
 *
 * Per-project "presets" (Trails, Skillset, personal) override these values
 * while inheriting the structure — the NPS Unigrid model: one system, many
 * parks. Keep the SHAPE stable; vary the VALUES per preset.
 */
export const tokens = {
  color: {
    brand: "#b45309",
    ink: "#1c1917",
    muted: "#78716c",
    paper: "#faf7f0",
  },
  font: {
    mono: "Berkeley Mono, ui-monospace, SFMono-Regular, monospace",
    sans: "Inter, system-ui, sans-serif",
    serif: "Source Serif 4, Georgia, serif",
  },
} as const;

export type Tokens = typeof tokens;
