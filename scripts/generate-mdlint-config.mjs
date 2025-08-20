#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Inlined from @outfitter/rightdown to avoid circular dependency during install

// --- START Inlined from presets.ts ---
const strictConfig = {
  extends: null,
  default: true,
  MD003: { style: 'atx' },
  MD004: { style: 'dash' },
  MD007: { indent: 2 },
  MD013: { line_length: 80, code_blocks: false, tables: false },
  MD024: { siblings_only: true },
  MD029: { style: 'ordered' },
  MD035: { style: '---' },
  MD046: { style: 'fenced' },
  MD048: { style: 'backtick' },
  MD049: { style: 'underscore' },
  MD050: { style: 'asterisk' },
  ignores: [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    'coverage/**',
    '*.min.md',
  ],
};

const standardConfig = {
  extends: null,
  default: true,
  MD003: { style: 'atx' },
  MD004: { style: 'dash' },
  MD007: { indent: 2 },
  MD013: false, // Line length handled by prettier
  MD024: { siblings_only: true },
  MD026: false, // Allow trailing punctuation in headings
  MD029: { style: 'ordered' },
  MD033: false, // Allow inline HTML
  MD036: false, // Allow emphasis as headings
  MD041: false, // First line doesn't need to be heading
  MD043: false, // Required heading structure
  MD046: { style: 'fenced' },
  ignores: [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    'coverage/**',
    'CHANGELOG.md',
    '*.min.md',
  ],
};

const relaxedConfig = {
  extends: null,
  default: false,
  MD001: true,
  MD003: { style: 'atx' },
  MD009: true,
  MD010: true,
  MD011: true,
  MD018: true,
  MD022: true,
  MD023: true,
  MD025: true,
  MD031: true,
  MD032: true,
  MD040: true,
  MD042: true,
  MD045: true,
  ignores: [
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    'coverage/**',
    'vendor/**',
    'third_party/**',
    '*.generated.md',
  ],
};

const presetConfigs = {
  strict: strictConfig,
  standard: standardConfig,
  relaxed: relaxedConfig,
};

function getPresetConfig(preset) {
  return { ...(presetConfigs[preset] || presetConfigs.standard) };
}
// --- END Inlined from presets.ts ---

// --- START Inlined from config-generator.ts ---
const defaultTerminology = [
  { incorrect: 'NPM', correct: 'npm' },
  { incorrect: 'Javascript', correct: 'JavaScript' },
  { incorrect: 'Typescript', correct: 'TypeScript' },
  { incorrect: 'VSCode', correct: 'VS Code' },
  { incorrect: 'MacOS', correct: 'macOS' },
  { incorrect: 'Github', correct: 'GitHub' },
  { incorrect: 'gitlab', correct: 'GitLab' },
  { incorrect: 'nodejs', correct: 'Node.js' },
  { incorrect: 'react native', correct: 'React Native' },
];

function generateConfig(options = {}) {
  const {
    preset = 'standard',
    terminology = [],
    customRules = [],
    ignores = [],
  } = options;
  const config = getPresetConfig(preset);

  if (terminology.length > 0) {
    config.terminology = terminology;
  }
  if (customRules.length > 0) {
    config.customRules = [...(config.customRules || []), ...customRules];
  }
  if (ignores.length > 0) {
    config.ignores = [...new Set([...(config.ignores || []), ...ignores])];
  }

  return JSON.stringify(config, null, 2);
}
// --- END Inlined from config-generator.ts ---

const config = generateConfig({
  preset: 'standard',
  terminology: defaultTerminology,
  ignores: ['CHANGELOG.md'],
  customRules: [], // Removed rightdown reference since package was deleted
});

const outputPath = join(process.cwd(), '.markdownlint.json');

writeFileSync(outputPath, config);

console.log(`✅ Generated .markdownlint.json with 'standard' preset.`);
