import { describe, it, expect } from 'vitest';
import * as mdMedic from '../index.js';

describe('md-medic exports', () => {
  it('should export markdownlintCli2 object', () => {
    expect(mdMedic).toHaveProperty('markdownlintCli2');
    expect(typeof mdMedic.markdownlintCli2).toBe('object');
  });

  it('should export generateConfig function', () => {
    expect(mdMedic).toHaveProperty('generateConfig');
    expect(typeof mdMedic.generateConfig).toBe('function');
  });

  it('should export getPresetConfig function', () => {
    expect(mdMedic).toHaveProperty('getPresetConfig');
    expect(typeof mdMedic.getPresetConfig).toBe('function');
  });

  it('should export presets object', () => {
    expect(mdMedic).toHaveProperty('presets');
    expect(mdMedic.presets).toHaveProperty('strict');
    expect(mdMedic.presets).toHaveProperty('standard');
    expect(mdMedic.presets).toHaveProperty('relaxed');
  });

  it('should export defaultTerminology object', () => {
    expect(mdMedic).toHaveProperty('defaultTerminology');
    expect(typeof mdMedic.defaultTerminology).toBe('object');
  });

  it('should export type definitions', () => {
    // This just verifies the module loads without errors
    expect(mdMedic).toBeDefined();
  });
});
