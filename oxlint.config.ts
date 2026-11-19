import ultracite from "ultracite/oxlint/core";

/**
 * Oxlint config. Extends the shared Ultracite ruleset (the Outfitter house
 * toolchain across Trails/Skillset). Generated dirs (.next/.source/.turbo/dist)
 * are skipped via .gitignore, which oxlint respects. archive/ holds frozen
 * reference snapshots that are never built, so it is skipped too.
 */
export default {
  extends: [ultracite],
  globals: {
    Bun: "readonly",
  },
  ignorePatterns: [...(ultracite.ignorePatterns ?? []), "archive/**"],
  rules: {
    // React components and Next route exports (default page/layout,
    // generateStaticParams, generateMetadata) are idiomatically function
    // declarations — every Next/Fumadocs example writes them that way. Don't
    // force arrow-expression style in a Next/React-heavy repo.
    "func-style": "off",
  },
};
