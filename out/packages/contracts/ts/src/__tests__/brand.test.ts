import { describe, expect, it } from 'vitest';
import type { Branded } from '../brand';

describe('Branded Types', () => {
  it('should create a nominal type that is not assignable to the base type', () => {
    type UserId = Branded<string, 'UserId'>;
    type PostId = Branded<string, 'PostId'>;

    const createUserId = (id: string): UserId => id as UserId;
    const createPostId = (id: string): PostId => id as PostId;

    const userId = createUserId('user-123');
    const postId = createPostId('post-456');

    // @ts-expect-error: A PostId should not be assignable to a UserId
    const invalidAssignment: UserId = postId;
    expect(invalidAssignment).toBe(postId); // This line runs, but TypeScript catches the error

    // A branded type should be assignable to its base type
    const baseString: string = userId;
    expect(baseString).toBe('user-123');

    // A base type should not be assignable to a branded type without casting
    const regularString = 'abc';
    // @ts-expect-error: A regular string should not be assignable to UserId
    const invalidUserId: UserId = regularString;
    expect(invalidUserId).toBe(regularString);
  });

  it('should work with numbers', () => {
    type ProductId = Branded<number, 'ProductId'>;

    const createProductId = (id: number): ProductId => id as ProductId;

    const productId = createProductId(12_345);
    const regularNumber = 67_890;

    // @ts-expect-error: A regular number should not be assignable to ProductId
    const invalidProductId: ProductId = regularNumber;
    expect(invalidProductId).toBe(regularNumber);

    const baseNumber: number = productId;
    expect(baseNumber).toBe(12_345);
  });
});
