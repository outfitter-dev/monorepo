import { describe, it, expect } from 'vitest';
import * as rightdown from '../index.js';

describe('rightdown exports', () => {
  it('should export core functionality', () => {
    expect(rightdown).toHaveProperty('ConfigReader');
    expect(typeof rightdown.ConfigReader).toBe('function');
    
    expect(rightdown).toHaveProperty('ConfigCompiler');
    expect(typeof rightdown.ConfigCompiler).toBe('function');
    
    expect(rightdown).toHaveProperty('Orchestrator');
    expect(typeof rightdown.Orchestrator).toBe('function');
    
    expect(rightdown).toHaveProperty('RIGHTDOWN_ERROR_CODES');
    expect(typeof rightdown.RIGHTDOWN_ERROR_CODES).toBe('object');
  });

  it('should export formatters', () => {
    expect(rightdown).toHaveProperty('PrettierFormatter');
    expect(typeof rightdown.PrettierFormatter).toBe('function');
    
    expect(rightdown).toHaveProperty('BiomeFormatter');
    expect(typeof rightdown.BiomeFormatter).toBe('function');
  });

  it('should export processors', () => {
    expect(rightdown).toHaveProperty('AstProcessor');
    expect(typeof rightdown.AstProcessor).toBe('function');
  });

  it('should export type definitions', () => {
    // This just verifies the module loads without errors
    expect(rightdown).toBeDefined();
  });
});