import { describe, expect, it } from "vitest";
import * as contracts from "../src/index.js";

describe("@outfitter/contracts", () => {
  it("should export the main module", () => {
    expect(contracts).toBeDefined();
  });

  it("should be an object", () => {
    expect(typeof contracts).toBe("object");
  });
});
