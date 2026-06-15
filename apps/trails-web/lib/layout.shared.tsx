import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

/**
 * Shared layout options for both the home and docs layouts.
 */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: "Trails",
    },
  };
}
