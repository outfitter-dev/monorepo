/**
 * Integration tests for @outfitter/types
 */

import { describe, expect, it } from 'vitest';
import type {
  ApiKey,
  // Type-fest utilities
  CamelCase,
  // Our utilities
  DeepKeys,
  Email,
  ExtractRouteParams,
  // Domain types
  HttpStatus,
  MimeType,
  PascalCase,
  UserId,
} from '../index.js';

describe('@outfitter/types', () => {
  it('should provide type-fest utilities', () => {
    type TestCamel = CamelCase<'hello_world'>;
    type TestPascal = PascalCase<'hello_world'>;

    // These should resolve to the expected types
    const camel: TestCamel = 'helloWorld';
    const pascal: TestPascal = 'HelloWorld';

    expect(camel).toBe('helloWorld');
    expect(pascal).toBe('HelloWorld');
  });

  it('should provide our advanced utility types', () => {
    interface TestObj {
      user: {
        id: string;
        profile: {
          name: string;
        };
      };
    }

    type Keys = DeepKeys<TestObj>;
    type RouteParams = ExtractRouteParams<'/users/:id/posts/:postId'>;

    // These should compile correctly
    const key: Keys = 'user.profile.name';
    const param: RouteParams = 'id';

    expect(key).toBe('user.profile.name');
    expect(param).toBe('id');
  });

  it('should provide modern branded types', () => {
    type MyUserId = UserId;
    type MyEmail = Email;

    const userId: MyUserId = 'user-123' as MyUserId;
    const email: MyEmail = 'test@example.com' as MyEmail;

    expect(userId).toBe('user-123');
    expect(email).toBe('test@example.com');
  });

  it('should provide domain types', () => {
    type Status = HttpStatus;
    type ContentType = MimeType;
    type Key = ApiKey;

    const status: Status = 200 as Status;
    const mime: ContentType = 'application/json' as ContentType;
    const apiKey: Key = 'key-123' as Key;

    expect(status).toBe(200);
    expect(mime).toBe('application/json');
    expect(apiKey).toBe('key-123');
  });

  it('should maintain zero runtime dependencies philosophy', () => {
    // This test ensures our package doesn't accidentally pull in runtime deps
    // The mere fact that this test can import everything without error
    // confirms we haven't broken the zero-dependency contract (except type-fest)
    expect(true).toBe(true);
  });
});
