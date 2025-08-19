#!/usr/bin/env bun

/**
 * CodeRabbit Feedback System Demo
 * 
 * Demonstrates the complete feedback loop system with sample data
 */

import { writeFile, readFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const DEMO_PATTERNS = [
  {
    pattern: 'Remove unused import',
    category: 'auto-fixable',
    description: 'Remove unused import `lodash` as it is not being used',
    frequency: 12,
    firstSeen: '2025-01-15T10:00:00Z',
    lastSeen: '2025-01-19T14:30:00Z',
    examples: [
      { file: 'src/utils/helpers.ts', line: 1, context: 'import lodash from "lodash"' },
      { file: 'src/components/Button.tsx', line: 2, context: 'import { debounce } from "lodash"' }
    ]
  },
  {
    pattern: 'Add missing await keyword',
    category: 'auto-fixable', 
    description: 'Add missing `await` before async function call',
    frequency: 8,
    firstSeen: '2025-01-16T09:15:00Z',
    lastSeen: '2025-01-19T11:45:00Z',
    examples: [
      { file: 'src/api/client.ts', line: 25, context: 'const response = fetch("/api/data")' },
      { file: 'src/services/auth.ts', line: 42, context: 'const user = getUserProfile(id)' }
    ]
  },
  {
    pattern: 'Use const instead of let',
    category: 'auto-fixable',
    description: 'Variable is never reassigned, use const instead of let',
    frequency: 15,
    firstSeen: '2025-01-14T16:20:00Z',
    lastSeen: '2025-01-19T13:10:00Z',
    examples: [
      { file: 'src/utils/format.ts', line: 10, context: 'let result = processData(input)' },
      { file: 'src/hooks/useApi.ts', line: 18, context: 'let config = { timeout: 5000 }' }
    ]
  },
  {
    pattern: 'Consider using state machine',
    category: 'needs-human-review',
    description: 'Consider using a state machine for managing this complex async flow',
    frequency: 3,
    firstSeen: '2025-01-17T14:00:00Z',
    lastSeen: '2025-01-19T10:20:00Z',
    examples: [
      { file: 'src/components/UploadFlow.tsx', line: 45, context: 'Complex state management with multiple flags' }
    ]
  },
  {
    pattern: 'Add accessibility attributes',
    category: 'auto-fixable',
    description: 'Missing aria-label attribute for better accessibility',
    frequency: 6,
    firstSeen: '2025-01-18T11:30:00Z',
    lastSeen: '2025-01-19T15:45:00Z',
    examples: [
      { file: 'src/components/IconButton.tsx', line: 12, context: '<button onClick={onClick}>' },
      { file: 'src/components/Modal.tsx', line: 28, context: '<div className="modal-overlay">' }
    ]
  },
  {
    pattern: 'Performance: avoid inline objects',
    category: 'pattern-to-learn',
    description: 'Avoid creating objects inline in JSX props to prevent unnecessary re-renders',
    frequency: 7,
    firstSeen: '2025-01-16T13:15:00Z',
    lastSeen: '2025-01-19T12:00:00Z',
    examples: [
      { file: 'src/components/DataTable.tsx', line: 35, context: 'style={{ margin: 10 }}' },
      { file: 'src/pages/Dashboard.tsx', line: 67, context: 'config={{ enabled: true }}' }
    ]
  }
];

async function setupDemo(): Promise<void> {
  console.log('🎬 Setting up CodeRabbit Feedback System Demo...');
  
  // Create demo pattern database
  const demoDb = {
    meta: {
      version: '1.0.0',
      created: '2025-01-14T00:00:00Z',
      lastUpdated: new Date().toISOString(),
      totalPatterns: DEMO_PATTERNS.length,
      description: 'Demo pattern database for CodeRabbit Feedback Loop System'
    },
    patterns: Object.fromEntries(
      DEMO_PATTERNS.map((pattern, index) => [
        `demo-pattern-${index + 1}`,
        pattern
      ])
    ),
    statistics: {
      mostCommonCategories: {
        'auto-fixable': 41,
        'needs-human-review': 3,
        'pattern-to-learn': 7
      },
      mostCommonTypes: {
        'unused-imports': 12,
        'variable-declarations': 15,
        'async-await': 8,
        'accessibility': 6,
        'performance': 7,
        'architecture': 3
      },
      confidenceTrends: [],
      fixSuccessRates: {
        'unused-imports': 0.95,
        'variable-declarations': 0.92,
        'async-await': 0.88,
        'accessibility': 0.85
      }
    },
    learningRules: {
      autoFixThreshold: 0.7,
      patternRecognitionMinOccurrences: 3,
      maxExamplesPerPattern: 5,
      dataRetentionDays: 365
    }
  };
  
  // Save demo database
  const dbPath = path.join(process.cwd(), 'scripts', 'pattern-database.json');
  
  // Backup existing database if it exists
  if (existsSync(dbPath)) {
    const backupPath = `${dbPath}.backup.${Date.now()}`;
    const existingContent = await readFile(dbPath, 'utf-8');
    await writeFile(backupPath, existingContent, 'utf-8');
    console.log(`📁 Backed up existing database to: ${backupPath}`);
  }
  
  await writeFile(dbPath, JSON.stringify(demoDb, null, 2), 'utf-8');
  console.log('✅ Demo pattern database created');
  
  // Create sample source files for demonstration
  const sampleFiles = [
    {
      path: 'src/demo/unused-imports.ts',
      content: `import lodash from 'lodash'; // This import is unused
import { format } from 'date-fns';
import React from 'react';

export function formatCurrentDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}`
    },
    {
      path: 'src/demo/missing-await.ts', 
      content: `export async function fetchUserData(id: string) {
  // Missing await keyword here
  const response = fetch(\`/api/users/\${id}\`);
  return response.json();
}`
    },
    {
      path: 'src/demo/let-vs-const.ts',
      content: `export function processData(input: unknown[]) {
  let result = input.map(item => ({ ...item, processed: true })); // Should be const
  let mutableCounter = 0; // This one is correct as let
  
  for (const item of result) {
    mutableCounter++;
  }
  
  return { result, count: mutableCounter };
}`
    }
  ];
  
  // Create demo source files
  for (const file of sampleFiles) {
    const filePath = path.join(process.cwd(), file.path);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, file.content, 'utf-8');
  }
  
  console.log('✅ Demo source files created in src/demo/');
}

async function runDemo(): Promise<void> {
  console.log('\\n🚀 Running CodeRabbit Feedback System Demo...');
  
  try {
    // 1. Show pattern database analysis
    console.log('\\n📊 Step 1: Analyzing Pattern Database');
    console.log('   - Loading patterns from database...');
    console.log(`   - Found ${DEMO_PATTERNS.length} patterns`);
    console.log('   - Calculating statistics...');
    
    // 2. Simulate tooling updates
    console.log('\\n🔧 Step 2: Updating Development Tooling');
    console.log('   - Analyzing patterns for tooling improvements...');
    console.log('   - Would enable Biome rule: correctness/noUnusedImports');
    console.log('   - Would enable Biome rule: suspicious/noFloatingPromises'); 
    console.log('   - Would enable Biome rule: style/useConst');
    console.log('   - Would add accessibility rules to configuration');
    
    // 3. Generate analytics report
    console.log('\\n📈 Step 3: Generating Analytics Report');
    console.log('   - Calculating metrics and trends...');
    console.log('   - Assessing tooling effectiveness...');
    console.log('   - Creating improvement recommendations...');
    
    // Simulate report generation
    const reportPath = path.join('docs', 'reports', `demo-report-${new Date().toISOString().split('T')[0]}.md`);
    await mkdir(path.dirname(reportPath), { recursive: true });
    
    const demoReport = `# CodeRabbit Feedback Demo Report

Generated on: ${new Date().toISOString()}

## 📊 Overview

- **Total Patterns Identified**: ${DEMO_PATTERNS.length}
- **Total Pattern Occurrences**: ${DEMO_PATTERNS.reduce((sum, p) => sum + p.frequency, 0)}
- **Prevention Rate**: 78.5%
- **Configuration Health**: 🟡 Good

## 📈 Pattern Categories

| Category | Occurrences | Percentage |
|----------|-------------|------------|
| auto-fixable | 41 | 80.4% |
| pattern-to-learn | 7 | 13.7% |
| needs-human-review | 3 | 5.9% |

## 🏆 Top Patterns

${DEMO_PATTERNS
  .sort((a, b) => b.frequency - a.frequency)
  .slice(0, 5)
  .map((pattern, index) => `${index + 1}. **${pattern.description}** (${pattern.frequency} occurrences)`)
  .join('\\n')}

## 🎯 Improvement Opportunities

1. **High Impact**: Enable unused imports detection (12 occurrences)
2. **Medium Impact**: Add floating promises rule (8 occurrences) 
3. **Medium Impact**: Enforce const over let (15 occurrences)
4. **Low Impact**: Enhance accessibility rules (6 occurrences)

## 🚀 Recommended Actions

1. **Immediate**: Enable \`noUnusedImports\` rule in Biome configuration
2. **This Sprint**: Add \`noFloatingPromises\` and \`useConst\` rules
3. **Next Sprint**: Implement accessibility linting enhancements
4. **Future**: Create custom rule for inline object performance pattern

---

*This is a demo report generated by the CodeRabbit Feedback Loop System*`;

    await writeFile(reportPath, demoReport, 'utf-8');
    console.log(`   ✅ Demo report generated: ${reportPath}`);
    
    // 4. Show sample fix application
    console.log('\\n🔨 Step 4: Demonstrating Auto-Fix Capabilities');
    console.log('   - Would remove unused lodash import from unused-imports.ts');
    console.log('   - Would add await keyword in missing-await.ts');
    console.log('   - Would change let to const in let-vs-const.ts');
    console.log('   - Human review flagged for state machine suggestion');
    
    console.log('\\n✨ Demo completed successfully!');
    console.log('\\n📋 Summary:');
    console.log(`   - Processed ${DEMO_PATTERNS.length} feedback patterns`);
    console.log('   - Identified 4 tooling improvements');
    console.log('   - Generated analytics report');
    console.log('   - Demonstrated 3 types of auto-fixes');
    
    console.log('\\n🔗 Next Steps:');
    console.log('   - Review the generated report in docs/reports/');
    console.log('   - Examine the demo source files in src/demo/');
    console.log('   - Run actual system: bun run coderabbit:update-tooling');
    console.log('   - Generate real report: bun run coderabbit:report');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
    throw error;
  }
}

async function cleanupDemo(): Promise<void> {
  console.log('\\n🧹 Demo cleanup options:');
  console.log('   - Pattern database: scripts/pattern-database.json (demo data)');
  console.log('   - Demo source files: src/demo/ (safe to delete)');
  console.log('   - Demo report: docs/reports/demo-report-*.md');
  console.log('\\nTo restore original pattern database, look for .backup files');
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.includes('--cleanup')) {
    await cleanupDemo();
    return;
  }
  
  console.log('🤖 CodeRabbit Feedback Loop System - Interactive Demo');
  console.log('   This demo shows how the system processes feedback and improves tooling\\n');
  
  await setupDemo();
  await runDemo();
  await cleanupDemo();
}

if (import.meta.main) {
  main().catch(error => {
    console.error('💥 Demo error:', error);
    process.exit(1);
  });
}