import type { Package, PackageSelection, PresetType } from '../types/index.js';

export const CONFIG_PACKAGES: Array<Package> = [
  {
    name: 'ESLint configuration',
    value: '@outfitter/eslint-config',
    selected: true,
  },
  {
    name: 'TypeScript configuration',
    value: '@outfitter/baselayer',
    selected: true,
  },
  {
    name: 'Prettier configuration',
    value: '@outfitter/prettier-config',
    selected: true,
  },
  {
    name: 'Husky (Git hooks)',
    value: '@outfitter/husky-config',
    selected: true,
  },
  {
    name: 'Changesets (versioning)',
    value: '@outfitter/changeset-config',
    selected: false,
  },
];

export const UTILITY_PACKAGES: Array<Package> = [
  {
    name: 'Contracts (Result pattern)',
    value: '@outfitter/contracts',
    selected: true,
  },
  {
    name: 'Contracts + Zod validation',
    value: '@outfitter/contracts-zod',
    selected: true,
  },
  {
    name: 'Packlist (Config manager)',
    value: '@outfitter/packlist',
    selected: false,
  },
];

export const PRESET_CONFIGURATIONS: Record<PresetType, PackageSelection> = {
  minimal: {
    configs: ['@outfitter/eslint-config'],
    utils: ['@outfitter/contracts'],
    fieldguides: [],
  },
  standard: {
    configs: [
      '@outfitter/eslint-config',
      '@outfitter/baselayer',
      '@outfitter/prettier-config',
      '@outfitter/husky-config',
    ],
    utils: ['@outfitter/contracts', '@outfitter/contracts-zod'],
    fieldguides: [], // Will be auto-detected
  },
  full: {
    configs: CONFIG_PACKAGES.map((p) => p.value),
    utils: UTILITY_PACKAGES.map((p) => p.value),
    fieldguides: [], // Will be auto-detected
  },
};
