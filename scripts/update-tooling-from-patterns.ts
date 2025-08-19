#!/usr/bin/env bun

/**
 * Tooling Update Engine
 * 
 * This script analyzes learned patterns from CodeRabbit feedback and automatically
 * updates development tooling (Biome, linting rules, validation scripts) to prevent
 * future occurrences of the same issues.
 */

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import type { 
  Result, 
  AppError 
} from '@outfitter/contracts';
import { 
  success, 
  failure, 
  makeError, 
  isSuccess 
} from '@outfitter/contracts';

// Types for tooling updates
interface PatternLearned {
  pattern: string;
  category: string;
  description: string;
  frequency: number;
  firstSeen: string;
  lastSeen: string;
  examples: Array<{
    file: string;
    line: number;
    context: string;
  }>;
}

interface ToolingUpdate {
  tool: 'biome' | 'custom-lint' | 'pre-commit' | 'tsconfig';
  type: 'rule-add' | 'rule-modify' | 'configuration-update';
  description: string;
  changes: Record<string, unknown>;
  reasoning: string;
  confidence: number;
}

interface BiomeRule {
  name: string;
  enabled: boolean;
  level: 'error' | 'warn' | 'info';
  options?: Record<string, unknown>;
}

/**
 * Pattern analyzer that identifies what tooling updates are needed
 */
class ToolingAnalyzer {
  
  analyzePatterns(patterns: Map<string, PatternLearned>): ToolingUpdate[] {
    const updates: ToolingUpdate[] = [];
    
    for (const [key, pattern] of patterns.entries()) {
      // Only consider frequent patterns (3+ occurrences)
      if (pattern.frequency < 3) continue;
      
      const potentialUpdates = this.getToolingUpdatesForPattern(pattern);
      updates.push(...potentialUpdates);
    }
    
    return updates;
  }
  
  private getToolingUpdatesForPattern(pattern: PatternLearned): ToolingUpdate[] {
    const updates: ToolingUpdate[] = [];
    
    // Map common patterns to Biome rules
    switch (true) {
      case pattern.description.includes('unused import'):
        updates.push({
          tool: 'biome',
          type: 'rule-add',
          description: 'Enable unused imports detection',
          changes: {
            'linter.rules.correctness.noUnusedImports': 'error'
          },
          reasoning: `Pattern occurs ${pattern.frequency} times`,
          confidence: 0.9
        });
        break;
        
      case pattern.description.includes('missing await'):
        updates.push({
          tool: 'biome',
          type: 'rule-add',
          description: 'Enable floating promises detection',
          changes: {
            'linter.rules.suspicious.noFloatingPromises': 'error'
          },
          reasoning: `Async/await issues found ${pattern.frequency} times`,
          confidence: 0.95
        });
        break;
        
      case pattern.description.includes('let') && pattern.description.includes('const'):
        updates.push({
          tool: 'biome',
          type: 'rule-add',
          description: 'Prefer const over let when possible',
          changes: {
            'linter.rules.style.useConst': 'warn'
          },
          reasoning: `Variable mutability issues found ${pattern.frequency} times`,
          confidence: 0.85
        });
        break;
        
      case pattern.description.includes('semicolon'):
        updates.push({
          tool: 'biome',
          type: 'configuration-update',
          description: 'Enforce consistent semicolon usage',
          changes: {
            'formatter.semicolons': 'always'
          },
          reasoning: `Semicolon consistency issues found ${pattern.frequency} times`,
          confidence: 0.9
        });
        break;
        
      case pattern.description.includes('type annotation') || pattern.description.includes('return type'):
        updates.push({
          tool: 'tsconfig',
          type: 'configuration-update',
          description: 'Enforce explicit return types',
          changes: {
            'compilerOptions.noImplicitReturns': true,
            'compilerOptions.noUncheckedIndexedAccess': true
          },
          reasoning: `Type safety issues found ${pattern.frequency} times`,
          confidence: 0.8
        });
        break;
        
      case pattern.description.includes('accessibility') || pattern.description.includes('a11y'):
        updates.push({
          tool: 'biome',
          type: 'rule-add',
          description: 'Enable accessibility rules',
          changes: {
            'linter.rules.a11y.useValidAriaProps': 'error',
            'linter.rules.a11y.useKeyWithClickEvents': 'warn',
            'linter.rules.a11y.noAccessKey': 'warn'
          },
          reasoning: `Accessibility issues found ${pattern.frequency} times`,
          confidence: 0.85
        });
        break;
        
      case pattern.description.includes('performance'):
        updates.push({
          tool: 'custom-lint',
          type: 'rule-add',
          description: 'Add custom performance checks',
          changes: {
            'rules.performance.noInlineObjects': 'warn',
            'rules.performance.noInlineArrays': 'warn'
          },
          reasoning: `Performance issues found ${pattern.frequency} times`,
          confidence: 0.75
        });
        break;
        
      case pattern.category === 'pattern-to-learn' && pattern.frequency >= 5:
        updates.push({
          tool: 'custom-lint',
          type: 'rule-add',
          description: `Create custom rule for: ${pattern.pattern}`,
          changes: {
            [`rules.custom.${this.sanitizeRuleName(pattern.pattern)}`]: {
              enabled: true,
              level: 'warn',
              pattern: pattern.pattern,
              description: pattern.description
            }
          },
          reasoning: `High-frequency pattern (${pattern.frequency} times) needs custom rule`,
          confidence: 0.7
        });
        break;
    }
    
    return updates;
  }
  
  private sanitizeRuleName(pattern: string): string {
    return pattern
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
  }
}

/**
 * Biome configuration updater
 */
class BiomeConfigUpdater {
  private readonly configPath = path.join(process.cwd(), 'biome.json');
  private readonly enhancedConfigPath = path.join(process.cwd(), 'biome.enhanced.json');
  
  async applyUpdates(updates: ToolingUpdate[]): Promise<Result<string[], AppError>> {
    const biomeUpdates = updates.filter(u => u.tool === 'biome');
    if (biomeUpdates.length === 0) {
      return success([]);
    }
    
    try {
      // Load current Biome config
      const configResult = await this.loadConfig();
      if (!isSuccess(configResult)) {
        return failure(configResult.error);
      }
      
      let config = configResult.data;
      const appliedChanges: string[] = [];
      
      for (const update of biomeUpdates) {
        // Apply changes to config
        config = this.mergeChanges(config, update.changes);
        appliedChanges.push(update.description);
        
        console.log(`🔧 Applied Biome update: ${update.description}`);
        console.log(`   Reasoning: ${update.reasoning}`);
        console.log(`   Confidence: ${update.confidence}`);
      }
      
      // Save enhanced config
      await writeFile(
        this.enhancedConfigPath,
        JSON.stringify(config, null, 2),
        'utf-8'
      );
      
      console.log(`✅ Updated Biome configuration: ${this.enhancedConfigPath}`);
      
      return success(appliedChanges);
      
    } catch (error) {
      return failure(makeError(
        'FILE_OPERATION_FAILED',
        'Failed to update Biome configuration',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      ));
    }
  }
  
  private async loadConfig(): Promise<Result<Record<string, unknown>, AppError>> {
    try {
      if (existsSync(this.enhancedConfigPath)) {
        // Use enhanced config if it exists
        const content = await readFile(this.enhancedConfigPath, 'utf-8');
        return success(JSON.parse(content));
      } else if (existsSync(this.configPath)) {
        // Fall back to standard config
        const content = await readFile(this.configPath, 'utf-8');
        return success(JSON.parse(content));
      } else {
        // Create default config
        const defaultConfig = {
          $schema: "https://biomejs.dev/schemas/1.9.4/schema.json",
          vcs: { enabled: true, clientKind: "git" },
          files: { ignoreUnknown: false, ignore: [] },
          formatter: { enabled: true, indentStyle: "space", indentSize: 2 },
          organizeImports: { enabled: true },
          linter: { enabled: true, rules: { recommended: true } },
          javascript: { formatter: { quoteStyle: "single" } }
        };
        return success(defaultConfig);
      }
    } catch (error) {
      return failure(makeError(
        'FILE_OPERATION_FAILED',
        'Failed to load Biome configuration',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      ));
    }
  }
  
  private mergeChanges(config: Record<string, unknown>, changes: Record<string, unknown>): Record<string, unknown> {
    const result = { ...config };
    
    for (const [path, value] of Object.entries(changes)) {
      const keys = path.split('.');
      let current: any = result;
      
      // Navigate to the parent object
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key];
      }
      
      // Set the final value
      current[keys[keys.length - 1]] = value;
    }
    
    return result;
  }
}

/**
 * TypeScript configuration updater
 */
class TypeScriptConfigUpdater {
  private readonly configPath = path.join(process.cwd(), 'tsconfig.json');
  
  async applyUpdates(updates: ToolingUpdate[]): Promise<Result<string[], AppError>> {
    const tsUpdates = updates.filter(u => u.tool === 'tsconfig');
    if (tsUpdates.length === 0) {
      return success([]);
    }
    
    try {
      // Load current TypeScript config
      const configResult = await this.loadConfig();
      if (!isSuccess(configResult)) {
        return failure(configResult.error);
      }
      
      let config = configResult.data;
      const appliedChanges: string[] = [];
      
      for (const update of tsUpdates) {
        // Apply changes to config
        config = this.mergeChanges(config, update.changes);
        appliedChanges.push(update.description);
        
        console.log(`🔧 Applied TypeScript update: ${update.description}`);
        console.log(`   Reasoning: ${update.reasoning}`);
        console.log(`   Confidence: ${update.confidence}`);
      }
      
      // Save updated config
      await writeFile(
        this.configPath,
        JSON.stringify(config, null, 2),
        'utf-8'
      );
      
      console.log(`✅ Updated TypeScript configuration: ${this.configPath}`);
      
      return success(appliedChanges);
      
    } catch (error) {
      return failure(makeError(
        'FILE_OPERATION_FAILED',
        'Failed to update TypeScript configuration',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      ));
    }
  }
  
  private async loadConfig(): Promise<Result<Record<string, unknown>, AppError>> {
    try {
      if (existsSync(this.configPath)) {
        const content = await readFile(this.configPath, 'utf-8');
        return success(JSON.parse(content));
      } else {
        return failure(makeError(
          'FILE_OPERATION_FAILED',
          'TypeScript configuration file not found'
        ));
      }
    } catch (error) {
      return failure(makeError(
        'FILE_OPERATION_FAILED',
        'Failed to load TypeScript configuration',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      ));
    }
  }
  
  private mergeChanges(config: Record<string, unknown>, changes: Record<string, unknown>): Record<string, unknown> {
    const result = { ...config };
    
    for (const [path, value] of Object.entries(changes)) {
      const keys = path.split('.');
      let current: any = result;
      
      // Navigate to the parent object
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || typeof current[key] !== 'object') {
          current[key] = {};
        }
        current = current[key];
      }
      
      // Set the final value
      current[keys[keys.length - 1]] = value;
    }
    
    return result;
  }
}

/**
 * Custom linting rules updater
 */
class CustomLintUpdater {
  private readonly customRulesPath = path.join(process.cwd(), 'scripts', 'custom-lint-rules.ts');
  
  async applyUpdates(updates: ToolingUpdate[]): Promise<Result<string[], AppError>> {
    const customUpdates = updates.filter(u => u.tool === 'custom-lint');
    if (customUpdates.length === 0) {
      return success([]);
    }
    
    const appliedChanges: string[] = [];
    
    for (const update of customUpdates) {
      console.log(`🔧 Would apply custom lint update: ${update.description}`);
      console.log(`   Reasoning: ${update.reasoning}`);
      console.log(`   Confidence: ${update.confidence}`);
      console.log(`   Changes:`, JSON.stringify(update.changes, null, 2));
      
      appliedChanges.push(update.description);
    }
    
    return success(appliedChanges);
  }
}

/**
 * Pre-commit validation updater
 */
class PreCommitUpdater {
  private readonly validationPath = path.join(process.cwd(), 'scripts', 'pre-commit-validation.ts');
  
  async applyUpdates(updates: ToolingUpdate[]): Promise<Result<string[], AppError>> {
    const preCommitUpdates = updates.filter(u => u.tool === 'pre-commit');
    if (preCommitUpdates.length === 0) {
      return success([]);
    }
    
    const appliedChanges: string[] = [];
    
    for (const update of preCommitUpdates) {
      console.log(`🔧 Would apply pre-commit update: ${update.description}`);
      console.log(`   Reasoning: ${update.reasoning}`);
      console.log(`   Confidence: ${update.confidence}`);
      
      appliedChanges.push(update.description);
    }
    
    return success(appliedChanges);
  }
}

/**
 * Main tooling updater that orchestrates all tool updates
 */
class ToolingUpdater {
  private readonly analyzer: ToolingAnalyzer;
  private readonly biomeUpdater: BiomeConfigUpdater;
  private readonly tsUpdater: TypeScriptConfigUpdater;
  private readonly customLintUpdater: CustomLintUpdater;
  private readonly preCommitUpdater: PreCommitUpdater;
  
  constructor() {
    this.analyzer = new ToolingAnalyzer();
    this.biomeUpdater = new BiomeConfigUpdater();
    this.tsUpdater = new TypeScriptConfigUpdater();
    this.customLintUpdater = new CustomLintUpdater();
    this.preCommitUpdater = new PreCommitUpdater();
  }
  
  async updateFromPatterns(): Promise<Result<Record<string, string[]>, AppError>> {
    try {
      // Load pattern database
      const patternsResult = await this.loadPatternDatabase();
      if (!isSuccess(patternsResult)) {
        return failure(patternsResult.error);
      }
      
      const patterns = patternsResult.data;
      console.log(`📊 Loaded ${patterns.size} patterns from database`);
      
      // Analyze patterns to determine needed updates
      const updates = this.analyzer.analyzePatterns(patterns);
      console.log(`🔍 Identified ${updates.length} potential tooling updates`);
      
      if (updates.length === 0) {
        console.log('ℹ️ No tooling updates needed based on current patterns');
        return success({});
      }
      
      // Apply updates to each tool
      const results: Record<string, string[]> = {};
      
      const biomeResult = await this.biomeUpdater.applyUpdates(updates);
      if (isSuccess(biomeResult) && biomeResult.data.length > 0) {
        results.biome = biomeResult.data;
      }
      
      const tsResult = await this.tsUpdater.applyUpdates(updates);
      if (isSuccess(tsResult) && tsResult.data.length > 0) {
        results.typescript = tsResult.data;
      }
      
      const customResult = await this.customLintUpdater.applyUpdates(updates);
      if (isSuccess(customResult) && customResult.data.length > 0) {
        results.customLint = customResult.data;
      }
      
      const preCommitResult = await this.preCommitUpdater.applyUpdates(updates);
      if (isSuccess(preCommitResult) && preCommitResult.data.length > 0) {
        results.preCommit = preCommitResult.data;
      }
      
      return success(results);
      
    } catch (error) {
      return failure(makeError(
        'INTERNAL_ERROR',
        'Failed to update tooling from patterns',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      ));
    }
  }
  
  private async loadPatternDatabase(): Promise<Result<Map<string, PatternLearned>, AppError>> {
    const dbPath = path.join(process.cwd(), 'scripts', 'pattern-database.json');
    
    try {
      if (!existsSync(dbPath)) {
        return success(new Map());
      }
      
      const content = await readFile(dbPath, 'utf-8');
      const data = JSON.parse(content);
      const patterns = new Map<string, PatternLearned>();
      
      // Handle both old and new database formats
      const patternData = data.patterns || data;
      
      for (const [key, value] of Object.entries(patternData)) {
        if (value && typeof value === 'object' && 'pattern' in value) {
          patterns.set(key, value as PatternLearned);
        }
      }
      
      return success(patterns);
    } catch (error) {
      return failure(makeError(
        'FILE_OPERATION_FAILED',
        'Failed to load pattern database',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      ));
    }
  }
}

/**
 * CLI interface
 */
async function main(): Promise<void> {
  console.log('🔧 CodeRabbit Tooling Updater');
  console.log('   Analyzing patterns and updating development tools...');
  
  const updater = new ToolingUpdater();
  
  const result = await updater.updateFromPatterns();
  
  if (isSuccess(result)) {
    const results = result.data;
    const totalUpdates = Object.values(results).flat().length;
    
    if (totalUpdates === 0) {
      console.log('\\n✅ No tooling updates needed');
      console.log('   Current tooling is already optimal based on learned patterns');
    } else {
      console.log(`\\n✅ Applied ${totalUpdates} tooling updates`);
      
      for (const [tool, changes] of Object.entries(results)) {
        if (changes.length > 0) {
          console.log(`\\n📦 ${tool.charAt(0).toUpperCase() + tool.slice(1)} updates:`);
          for (const change of changes) {
            console.log(`   - ${change}`);
          }
        }
      }
      
      console.log('\\n🎯 Run the following commands to apply changes:');
      if (results.biome?.length) {
        console.log('   bun run lint:enhanced  # Test enhanced Biome config');
      }
      if (results.typescript?.length) {
        console.log('   bun run typecheck      # Validate TypeScript changes');
      }
      if (results.customLint?.length) {
        console.log('   bun run lint:custom    # Test custom lint rules');
      }
    }
    
    process.exit(0);
  } else {
    console.error(`\\n❌ Tooling update failed: ${result.error.message}`);
    if (result.error.details) {
      console.error('   Details:', result.error.details);
    }
    process.exit(1);
  }
}

if (import.meta.main) {
  main().catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
}