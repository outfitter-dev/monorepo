import { describe, expect, it } from "vitest";
import * as types from "../src/index.js";

describe("@outfitter/types", () => {
  it("should export the main module", () => {
    expect(types).toBeDefined();
  });

  it("should be an object", () => {
    expect(typeof types).toBe("object");
  });
});
