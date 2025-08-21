import { describe, expect, it } from 'vitest';
import { assert, assertDefined, assertNever } from '../assert';

describe('assert', () => {
  it('should not throw for a truthy condition', () => {
    expect(() => assert(true)).not.toThrow();
    expect(() => assert(1)).not.toThrow();
    expect(() => assert('string')).not.toThrow();
    expect(() => assert({})).not.toThrow();
  });

  it('should throw for a falsy condition', () => {
    expect(() => assert(false)).toThrow('Assertion failed');
    expect(() => assert(0)).toThrow('Assertion failed');
    expect(() => assert('')).toThrow('Assertion failed');
    expect(() => assert(null)).toThrow('Assertion failed');
    expect(() => assert(undefined)).toThrow('Assertion failed');
  });

  it('should use a custom message when provided', () => {
    expect(() => assert(false, 'Custom message')).toThrow('Custom message');
  });
});

describe('assertDefined', () => {
  it('should not throw for a defined value', () => {
    expect(() => assertDefined('')).not.toThrow();
    expect(() => assertDefined(0)).not.toThrow();
    expect(() => assertDefined(false)).not.toThrow();
  });

  it('should throw for null or undefined', () => {
    expect(() => assertDefined(null)).toThrow('Value must be defined');
    expect(() => assertDefined(undefined)).toThrow('Value must be defined');
  });
});

describe('assertNever', () => {
  it('should throw an error when called', () => {
    expect(() => assertNever(undefined as never)).toThrow(
      'Unhandled value: undefined'
    );
  });

  it('should handle different never-like inputs for runtime check', () => {
    // biome-ignore lint/suspicious/noExplicitAny: Testing runtime behavior with invalid types
    const callWith = (val: any) => () => assertNever(val as never);
    expect(callWith(null)).toThrow('Unhandled value: null');
    expect(callWith('string')).toThrow('Unhandled value: "string"');
  });
});
