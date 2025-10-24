import { describe, expect, it } from "vitest";
import {
  createDefaultOutfitterConfig,
  DEFAULT_OUTFITTER_CONFIG,
  mergeOutfitterConfig,
  parseOutfitterConfig,
  safeParseOutfitterConfig,
} from "../src/index.js";

describe("Outfitter configuration", () => {
  it("creates an isolated default config", () => {
    const config = createDefaultOutfitterConfig();
    expect(config).not.toBe(DEFAULT_OUTFITTER_CONFIG);
    expect(config.features.typescript).toBe(true);
    config.features.typescript = false;
    expect(DEFAULT_OUTFITTER_CONFIG.features.typescript).toBe(true);
  });

  it("parses empty input to defaults", () => {
    const config = parseOutfitterConfig({});
    expect(config.features).toMatchObject({
      typescript: true,
      markdown: true,
      styles: false,
      json: true,
      commits: true,
      packages: false,
      testing: false,
      docs: false,
    });
    expect(config.ignore).toHaveLength(0);
    expect(config.presets).toHaveLength(0);
  });

  it("merges user features with defaults", () => {
    const config = mergeOutfitterConfig({
      features: {
        styles: true,
        packages: true,
      },
    });

    expect(config.features.styles).toBe(true);
    expect(config.features.packages).toBe(true);
    expect(config.features.typescript).toBe(true);
  });

  it("merges overrides without mutating input", () => {
    const overrides = {
      biome: {
        formatter: {
          indentStyle: "space",
        },
      },
    };

    const config = mergeOutfitterConfig({ overrides });
    expect(config.overrides.biome).toEqual(overrides.biome);
    expect(config.overrides.prettier).toBeUndefined();
    expect(overrides.biome?.formatter).toEqual({ indentStyle: "space" });
  });

  it("exposes validation errors via Result helper", () => {
    const result = safeParseOutfitterConfig({
      features: {
        typescript: "yes" as unknown as boolean,
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBeGreaterThanOrEqual(5000);
      expect(result.error.message).toContain("typescript");
    }
  });
});
