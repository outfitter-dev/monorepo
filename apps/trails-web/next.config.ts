import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const withMDX = createMDX();

const config: NextConfig = {
  reactStrictMode: true,
  // Compile workspace source directly (ship-source-in-monorepo, doc §5).
  // Avoids a package bundler mangling "use client" / RSC directives.
  transpilePackages: ["@outfitter/ui", "@outfitter/tokens"],
};

export default withMDX(config);
