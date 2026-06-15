import { FieldNote } from "@outfitter/ui";
import defaultMdxComponents from "fumadocs-ui/mdx";
import type { MDXComponents } from "mdx/types";

/**
 * MDX component map. Default Fumadocs components plus Tier 1 `@outfitter/ui`
 * components, so prose can reach for `<FieldNote>` and friends. This is the
 * seam where the shared component library meets the docs content.
 */
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    FieldNote,
    ...components,
  };
}
