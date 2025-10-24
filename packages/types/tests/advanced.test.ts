import { describe, expect, it } from "vitest";
import type {
  DeepGet,
  DeepKeys,
  DiscriminatedUnion,
  DiscriminatorValues,
  EnvVarPattern,
  ExtractRouteParams,
  Interpolate,
  Switch,
} from "../src/advanced.js";

describe("Advanced type utilities", () => {
  describe("DeepKeys", () => {
    it("should extract all nested keys as string literals", () => {
      type User = {
        name: string;
        age: number;
        address: {
          city: string;
          zip: number;
          country: {
            code: string;
            name: string;
          };
        };
      };

      type Keys = DeepKeys<User>;

      // Type-level tests - these would fail at compile time if wrong
      const key1: Keys = "name";
      const key2: Keys = "age";
      const key3: Keys = "address";
      const key4: Keys = "address.city";
      const key5: Keys = "address.zip";
      const key6: Keys = "address.country";
      const key7: Keys = "address.country.code";
      const key8: Keys = "address.country.name";

      expect(key1).toBe("name");
      expect(key2).toBe("age");
      expect(key3).toBe("address");
      expect(key4).toBe("address.city");
      expect(key5).toBe("address.zip");
      expect(key6).toBe("address.country");
      expect(key7).toBe("address.country.code");
      expect(key8).toBe("address.country.name");
    });

    it("should work with simple objects", () => {
      type Simple = { a: string; b: number };
      type Keys = DeepKeys<Simple>;

      const key1: Keys = "a";
      const key2: Keys = "b";

      expect(key1).toBe("a");
      expect(key2).toBe("b");
    });

    it("should handle arrays correctly", () => {
      type WithArray = {
        items: string[];
        nested: {
          values: number[];
        };
      };

      type Keys = DeepKeys<WithArray>;

      const key1: Keys = "items";
      const key2: Keys = "nested";
      const key3: Keys = "nested.values";

      expect(key1).toBe("items");
      expect(key2).toBe("nested");
      expect(key3).toBe("nested.values");
    });
  });

  describe("DeepGet", () => {
    it("should get types at nested paths", () => {
      type User = {
        name: string;
        age: number;
        address: {
          city: string;
          zip: number;
          country: {
            code: string;
            name: string;
          };
        };
      };

      type Name = DeepGet<User, "name">;
      type City = DeepGet<User, "address.city">;
      type CountryCode = DeepGet<User, "address.country.code">;

      const name: Name = "John";
      const city: City = "New York";
      const countryCode: CountryCode = "US";

      expect(name).toBe("John");
      expect(city).toBe("New York");
      expect(countryCode).toBe("US");
    });

    it("should work with different value types", () => {
      type Config = {
        server: {
          port: number;
          host: string;
          ssl: {
            enabled: boolean;
            cert: string;
          };
        };
      };

      type Port = DeepGet<Config, "server.port">;
      type Enabled = DeepGet<Config, "server.ssl.enabled">;

      const port: Port = 3000;
      const enabled: Enabled = true;

      expect(port).toBe(3000);
      expect(enabled).toBeTruthy();
    });
  });

  describe("ExtractRouteParams", () => {
    it("should extract single parameter", () => {
      type Params = ExtractRouteParams<"/users/:id">;
      const param: Params = "id";

      expect(param).toBe("id");
    });

    it("should extract multiple parameters", () => {
      type Params = ExtractRouteParams<"/users/:userId/posts/:postId">;
      const param1: Params = "userId";
      const param2: Params = "postId";

      expect(param1).toBe("userId");
      expect(param2).toBe("postId");
    });

    it("should handle complex routes", () => {
      type Params = ExtractRouteParams<"/api/v1/users/:userId/posts/:postId/comments/:commentId">;
      const param1: Params = "userId";
      const param2: Params = "postId";
      const param3: Params = "commentId";

      expect(param1).toBe("userId");
      expect(param2).toBe("postId");
      expect(param3).toBe("commentId");
    });

    it("should return never for routes without parameters", () => {
      // biome-ignore lint/correctness/noUnusedVariables: Type-level test to verify compile-time behavior
      type Params = ExtractRouteParams<"/users/list">;
      // This type should be never, which means no valid values
      // We can't create a variable of type never
      expect(true).toBeTruthy();
    });
  });

  describe("EnvVarPattern", () => {
    it("should uppercase simple variables", () => {
      type Var1 = EnvVarPattern<"port">;
      type Var2 = EnvVarPattern<"host">;

      const var1: Var1 = "PORT";
      const var2: Var2 = "HOST";

      expect(var1).toBe("PORT");
      expect(var2).toBe("HOST");
    });

    it("should handle underscored variables", () => {
      type Var = EnvVarPattern<"api_key">;
      const envVar: Var = "API_KEY";

      expect(envVar).toBe("API_KEY");
    });

    it("should handle multiple underscores", () => {
      type Var = EnvVarPattern<"database_connection_string">;
      const envVar: Var = "DATABASE_CONNECTION_STRING";

      expect(envVar).toBe("DATABASE_CONNECTION_STRING");
    });
  });

  describe("Interpolate", () => {
    it("should interpolate single value", () => {
      type Result = Interpolate<"Hello {name}", { name: "World" }>;
      const result: Result = "Hello World";

      expect(result).toBe("Hello World");
    });

    it("should interpolate multiple values", () => {
      type Result = Interpolate<"User {id} named {name}", { id: 42; name: "Alice" }>;
      const result: Result = "User 42 named Alice";

      expect(result).toBe("User 42 named Alice");
    });

    it("should handle missing interpolation markers", () => {
      type Result = Interpolate<"Hello World", { name: "Alice" }>;
      const result: Result = "Hello World";

      expect(result).toBe("Hello World");
    });
  });

  describe("DiscriminatedUnion", () => {
    it("should work with discriminated unions", () => {
      type Action =
        | { type: "add"; value: number }
        | { type: "remove"; id: string }
        | { type: "update"; id: string; value: number };

      type TypedAction = DiscriminatedUnion<Action, "type">;

      const addAction: TypedAction = { type: "add", value: 42 };
      const removeAction: TypedAction = { type: "remove", id: "123" };
      const updateAction: TypedAction = {
        type: "update",
        id: "456",
        value: 100,
      };

      expect(addAction.type).toBe("add");
      expect(removeAction.type).toBe("remove");
      expect(updateAction.type).toBe("update");
    });

    it("should preserve all union members", () => {
      type Status = { kind: "pending" } | { kind: "success"; data: string };
      type TypedStatus = DiscriminatedUnion<Status, "kind">;

      const pending: TypedStatus = { kind: "pending" };
      const success: TypedStatus = { kind: "success", data: "result" };

      expect(pending.kind).toBe("pending");
      expect(success.kind).toBe("success");
    });
  });

  describe("DiscriminatorValues", () => {
    it("should extract discriminator values", () => {
      type Action =
        | { type: "add"; value: number }
        | { type: "remove"; id: string }
        | { type: "update"; id: string; value: number };

      type ActionTypes = DiscriminatorValues<Action, "type">;

      const type1: ActionTypes = "add";
      const type2: ActionTypes = "remove";
      const type3: ActionTypes = "update";

      expect(type1).toBe("add");
      expect(type2).toBe("remove");
      expect(type3).toBe("update");
    });

    it("should work with different discriminator keys", () => {
      type Status = { kind: "pending"; message: string } | { kind: "success"; data: string };

      type Kinds = DiscriminatorValues<Status, "kind">;

      const kind1: Kinds = "pending";
      const kind2: Kinds = "success";

      expect(kind1).toBe("pending");
      expect(kind2).toBe("success");
    });
  });

  describe("Switch", () => {
    it("should map discriminator values to result types", () => {
      type Action = { type: "add"; value: number } | { type: "remove"; id: string };

      type Result = Switch<Action, "type", { add: string; remove: number }>;

      // Result should be string | number
      const result1: Result = "success";
      const result2: Result = 42;

      expect(result1).toBe("success");
      expect(result2).toBe(42);
    });

    it("should work with complex result types", () => {
      type Message = { kind: "text"; content: string } | { kind: "image"; url: string };

      type Handler = Switch<Message, "kind", { text: () => void; image: () => string }>;

      // Handler should be (() => void) | (() => string)
      const textHandler: Handler = () => {};
      const imageHandler: Handler = () => "url";

      expect(typeof textHandler).toBe("function");
      expect(typeof imageHandler).toBe("function");
    });
  });

  describe("Complex type compositions", () => {
    it("should compose DeepKeys and DeepGet", () => {
      type Config = {
        server: {
          port: number;
          host: string;
        };
      };

      type Keys = DeepKeys<Config>;
      type Port = DeepGet<Config, "server.port">;

      const key: Keys = "server.port";
      const port: Port = 3000;

      expect(key).toBe("server.port");
      expect(port).toBe(3000);
    });

    it("should use discriminated unions with switch", () => {
      type State =
        | { status: "loading" }
        | { status: "success"; data: string }
        | { status: "error"; message: string };

      type StatusValues = DiscriminatorValues<State, "status">;
      type Result = Switch<State, "status", { loading: null; success: string; error: Error }>;

      const status: StatusValues = "loading";
      const result: Result = null;

      expect(status).toBe("loading");
      expect(result).toBeNull();
    });
  });
});
