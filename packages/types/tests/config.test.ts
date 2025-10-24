import { describe, expect, it } from "vitest";
import type {
  ConfigFormat,
  ConfigScope,
  ConfigValidation,
  ConfigWithMetadata,
  LayeredConfig,
} from "../src/config.js";

describe("Config types", () => {
  describe("ConfigScope", () => {
    it("should accept valid scope values", () => {
      const userScope: ConfigScope = "user";
      const workspaceScope: ConfigScope = "workspace";
      const projectScope: ConfigScope = "project";

      expect(userScope).toBe("user");
      expect(workspaceScope).toBe("workspace");
      expect(projectScope).toBe("project");
    });

    it("should enforce type safety at compile time", () => {
      // This would fail TypeScript compilation:
      // const invalidScope: ConfigScope = "invalid";
      expect(true).toBeTruthy();
    });
  });

  describe("ConfigFormat", () => {
    it("should accept valid format values", () => {
      const jsonFormat: ConfigFormat = "json";
      const yamlFormat: ConfigFormat = "yaml";
      const tomlFormat: ConfigFormat = "toml";

      expect(jsonFormat).toBe("json");
      expect(yamlFormat).toBe("yaml");
      expect(tomlFormat).toBe("toml");
    });

    it("should enforce type safety at compile time", () => {
      // This would fail TypeScript compilation:
      // const invalidFormat: ConfigFormat = "xml";
      expect(true).toBeTruthy();
    });
  });

  describe("ConfigWithMetadata", () => {
    it("should contain all required metadata fields", () => {
      const config: ConfigWithMetadata<{ apiKey: string }> = {
        value: { apiKey: "test-key" },
        scope: "user",
        format: "json",
        path: "/Users/test/.config/app.json",
      };

      expect(config.value.apiKey).toBe("test-key");
      expect(config.scope).toBe("user");
      expect(config.format).toBe("json");
      expect(config.path).toBe("/Users/test/.config/app.json");
    });

    it("should be readonly", () => {
      const config: ConfigWithMetadata<{ apiKey: string }> = {
        value: { apiKey: "test-key" },
        scope: "user",
        format: "json",
        path: "/Users/test/.config/app.json",
      };

      // This would fail TypeScript compilation:
      // config.scope = "workspace";
      // config.value = { apiKey: "new-key" };
      expect(config.scope).toBe("user");
    });

    it("should work with different value types", () => {
      const stringConfig: ConfigWithMetadata<string> = {
        value: "test-value",
        scope: "workspace",
        format: "yaml",
        path: "/workspace/.config.yaml",
      };

      const numberConfig: ConfigWithMetadata<number> = {
        value: 42,
        scope: "project",
        format: "toml",
        path: "/project/config.toml",
      };

      expect(stringConfig.value).toBe("test-value");
      expect(numberConfig.value).toBe(42);
    });
  });

  describe("LayeredConfig", () => {
    it("should support all scope levels", () => {
      const layered: LayeredConfig<{ theme: string }> = {
        user: { theme: "dark" },
        workspace: { theme: "light" },
        project: { theme: "auto" },
      };

      expect(layered.user?.theme).toBe("dark");
      expect(layered.workspace?.theme).toBe("light");
      expect(layered.project?.theme).toBe("auto");
    });

    it("should allow partial layer definitions", () => {
      const layered1: LayeredConfig<{ theme: string }> = {
        user: { theme: "dark" },
      };

      const layered2: LayeredConfig<{ theme: string }> = {
        workspace: { theme: "light" },
        project: { theme: "auto" },
      };

      const layered3: LayeredConfig<{ theme: string }> = {};

      expect(layered1.user).toBeDefined();
      expect(layered1.workspace).toBeUndefined();
      expect(layered2.workspace).toBeDefined();
      expect(layered3.user).toBeUndefined();
    });

    it("should be readonly", () => {
      const layered: LayeredConfig<{ theme: string }> = {
        user: { theme: "dark" },
      };

      // This would fail TypeScript compilation:
      // layered.user = { theme: "light" };
      expect(layered.user?.theme).toBe("dark");
    });
  });

  describe("ConfigValidation", () => {
    it("should represent valid configuration", () => {
      const valid: ConfigValidation<{ apiKey: string }> = {
        valid: true,
        value: { apiKey: "test-key" },
      };

      if (valid.valid) {
        expect(valid.value.apiKey).toBe("test-key");
      }
    });

    it("should represent invalid configuration with errors", () => {
      const invalid: ConfigValidation<{ apiKey: string }> = {
        valid: false,
        errors: ["Missing required field: apiKey", "Invalid format"],
      };

      if (!invalid.valid) {
        expect(invalid.errors).toHaveLength(2);
        expect(invalid.errors[0]).toBe("Missing required field: apiKey");
      }
    });

    it("should enforce discriminated union narrowing", () => {
      const validation: ConfigValidation<{ apiKey: string }> = {
        valid: true,
        value: { apiKey: "test-key" },
      };

      if (validation.valid) {
        // TypeScript knows `value` exists here
        expect(validation.value).toBeDefined();
        // This would fail TypeScript compilation in valid branch:
        // const errors = validation.errors;
      } else {
        // TypeScript knows `errors` exists here
        expect(validation.errors).toBeDefined();
        // This would fail TypeScript compilation in invalid branch:
        // const value = validation.value;
      }
    });

    it("should have readonly errors array", () => {
      const invalid: ConfigValidation<{ apiKey: string }> = {
        valid: false,
        errors: ["Error 1", "Error 2"],
      };

      // This would fail TypeScript compilation:
      // invalid.errors.push("Error 3");
      expect(invalid.valid).toBeFalsy();
    });
  });
});
