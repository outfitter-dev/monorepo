import oxfmt from "ultracite/oxfmt";

/**
 * Formatter config. Spreads the Ultracite oxfmt defaults and pins
 * `proseWrap: "never"` — markdown is authored at paragraph granularity, never
 * hard-wrapped at a column. oxfmt respects .gitignore for generated dirs;
 * archive/ (frozen reference snapshots) is skipped explicitly.
 */
export default {
  ...oxfmt,
  ignorePatterns: [...(oxfmt.ignorePatterns ?? []), "archive/**"],
  proseWrap: "never",
};
