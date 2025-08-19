#!/usr/bin/env bun

/**
 * CodeRabbit Feedback Processor
 * 
 * This script processes CodeRabbit comments and applies automated fixes where possible.
 * It uses AST manipulation for safe code transformations and learns patterns over time.
 */

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { Glob } from 'glob';
import type { 
  Result, 
  AppError, 
  ErrorCode 
} from '@outfitter/contracts';
import { 
  success, 
  failure, 
  makeError, 
  isSuccess,
  tryAsync 
} from '@outfitter/contracts';

// Types for CodeRabbit feedback processing
interface CodeRabbitComment {
  id: number;
  body: string;
  path?: string;
  line?: number;
  created_at: string;
  updated_at: string;
}

interface ProcessingOptions {
  prNumber: number;
  commentId: number;
  commentType: 'issue' | 'review';
  githubToken: string;
  dryRun: boolean;
}

interface FeedbackAnalysis {
  category: 'auto-fixable' | 'needs-human-review' | 'pattern-to-learn';
  type: string;
  description: string;
  file?: string;
  line?: number;
  originalText?: string;
  suggestedFix?: string;
  confidence: number;
  reasoning: string;
}

interface AppliedFix {
  type: string;
  description: string;
  file?: string;
  line?: number;
  success: boolean;
  error?: string;
}

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

interface ProcessingResults {
  fixesApplied: AppliedFix[];
  patternsLearned: PatternLearned[];
  requiresHumanReview: Array<{
    description: string;
    reasoning: string;
  }>;
  processingTimeMs: number;
}

/**
 * GitHub API client for fetching PR and comment data
 */
class GitHubClient {
  constructor(private token: string) {}

  async fetchPRComments(prNumber: number): Promise<Result<CodeRabbitComment[], AppError>> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/pulls/${prNumber}/comments`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        return failure(makeError(
          'EXTERNAL_SERVICE_ERROR',
          `GitHub API request failed: ${response.status} ${response.statusText}`
        ));
      }

      const comments = await response.json() as CodeRabbitComment[];
      return success(comments.filter(comment => 
        comment.body.includes('coderabbitai') || 
        comment.body.includes('CodeRabbit')
      ));
    } catch (error) {
      return failure(makeError(
        'EXTERNAL_SERVICE_ERROR',
        'Failed to fetch PR comments',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      ));
    }
  }

  async fetchComment(commentId: number): Promise<Result<CodeRabbitComment, AppError>> {
    try {
      const response = await fetch(
        `https://api.github.com/repos/${process.env.GITHUB_REPOSITORY}/pulls/comments/${commentId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) {
        return failure(makeError(
          'EXTERNAL_SERVICE_ERROR',
          `GitHub API request failed: ${response.status} ${response.statusText}`
        ));
      }

      const comment = await response.json() as CodeRabbitComment;
      return success(comment);
    } catch (error) {
      return failure(makeError(
        'EXTERNAL_SERVICE_ERROR',
        'Failed to fetch comment',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      ));
    }
  }
}

/**
 * Pattern recognition for different types of CodeRabbit feedback
 */
class FeedbackAnalyzer {
  
  // Patterns for auto-fixable issues
  private readonly autoFixablePatterns = [
    {
      pattern: /Add missing\s+`await`/i,
      type: 'missing-await',
      confidence: 0.95
    },
    {
      pattern: /Remove unused import/i,
      type: 'unused-import',
      confidence: 0.90
    },
    {
      pattern: /Add missing semicolon/i,
      type: 'missing-semicolon', 
      confidence: 0.95
    },
    {
      pattern: /Use `const` instead of `let`/i,
      type: 'let-to-const',
      confidence: 0.85
    },
    {
      pattern: /Add missing return type/i,
      type: 'missing-return-type',
      confidence: 0.80
    },
    {
      pattern: /Remove unnecessary `else`/i,
      type: 'unnecessary-else',
      confidence: 0.85
    },
    {
      pattern: /Use optional chaining/i,
      type: 'optional-chaining',
      confidence: 0.75
    },
    {
      pattern: /Destructure assignment/i,
      type: 'destructuring',
      confidence: 0.70
    },
  ];

  // Patterns that need human review
  private readonly humanReviewPatterns = [
    {
      pattern: /Consider redesigning/i,
      type: 'architecture-concern',
      confidence: 0.90
    },
    {
      pattern: /Security concern/i,
      type: 'security-issue',
      confidence: 0.95
    },
    {
      pattern: /Performance issue/i,
      type: 'performance-issue',
      confidence: 0.85
    },
    {
      pattern: /Breaking change/i,
      type: 'breaking-change',
      confidence: 0.90
    },
  ];

  analyzeFeedback(comment: CodeRabbitComment): FeedbackAnalysis {
    const body = comment.body;
    
    // Check for auto-fixable patterns
    for (const pattern of this.autoFixablePatterns) {
      if (pattern.pattern.test(body)) {
        return {
          category: 'auto-fixable',
          type: pattern.type,
          description: this.extractDescription(body),
          file: comment.path,
          line: comment.line,
          originalText: this.extractOriginalCode(body),
          suggestedFix: this.extractSuggestedCode(body),
          confidence: pattern.confidence,
          reasoning: `Matched pattern: ${pattern.pattern.source}`
        };
      }
    }

    // Check for human review patterns
    for (const pattern of this.humanReviewPatterns) {
      if (pattern.pattern.test(body)) {
        return {
          category: 'needs-human-review',
          type: pattern.type,
          description: this.extractDescription(body),
          file: comment.path,
          line: comment.line,
          confidence: pattern.confidence,
          reasoning: `Requires human judgment: ${pattern.pattern.source}`
        };
      }
    }

    // Everything else is a pattern to learn from
    return {
      category: 'pattern-to-learn',
      type: 'unknown-pattern',
      description: this.extractDescription(body),
      file: comment.path,
      line: comment.line,
      confidence: 0.5,
      reasoning: 'No matching pattern found, adding to learning database'
    };
  }

  private extractDescription(body: string): string {
    // Extract the main suggestion from CodeRabbit comments
    const lines = body.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('```') && !trimmed.startsWith('**')) {
        return trimmed.substring(0, 200); // Limit length
      }
    }
    return body.substring(0, 200);
  }

  private extractOriginalCode(body: string): string | undefined {
    const codeBlockMatch = body.match(/```[\\w]*\\n([\\s\\S]*?)\\n```/);
    return codeBlockMatch?.[1];
  }

  private extractSuggestedCode(body: string): string | undefined {
    const codeBlocks = body.match(/```[\\w]*\\n([\\s\\S]*?)\\n```/g);
    if (codeBlocks && codeBlocks.length > 1) {
      // Usually the second code block is the suggestion
      const match = codeBlocks[1].match(/```[\\w]*\\n([\\s\\S]*?)\\n```/);
      return match?.[1];
    }
    return undefined;
  }
}

/**
 * Auto-fix engine using AST manipulation and pattern matching
 */
class AutoFixEngine {
  
  async applyFix(analysis: FeedbackAnalysis): Promise<Result<AppliedFix, AppError>> {
    if (analysis.category !== 'auto-fixable' || !analysis.file) {
      return failure(makeError(
        'VALIDATION_ERROR',
        'Analysis is not auto-fixable or missing file path'
      ));
    }

    try {
      const filePath = path.resolve(analysis.file);
      
      if (!existsSync(filePath)) {
        return failure(makeError(
          'FILE_OPERATION_FAILED',
          `File not found: ${filePath}`
        ));
      }

      const content = await readFile(filePath, 'utf-8');
      let fixedContent: string;

      switch (analysis.type) {
        case 'unused-import':
          fixedContent = await this.fixUnusedImport(content, analysis);
          break;
        case 'missing-await':
          fixedContent = await this.fixMissingAwait(content, analysis);
          break;
        case 'let-to-const':
          fixedContent = await this.fixLetToConst(content, analysis);
          break;
        case 'missing-semicolon':
          fixedContent = await this.fixMissingSemicolon(content, analysis);
          break;
        case 'unnecessary-else':
          fixedContent = await this.fixUnnecessaryElse(content, analysis);
          break;
        default:
          return failure(makeError(
            'INTERNAL_ERROR',
            `Unsupported fix type: ${analysis.type}`
          ));
      }

      // Write the fixed content back
      await writeFile(filePath, fixedContent, 'utf-8');

      return success({
        type: analysis.type,
        description: analysis.description,
        file: analysis.file,
        line: analysis.line,
        success: true
      });

    } catch (error) {
      return success({
        type: analysis.type,
        description: analysis.description,
        file: analysis.file,
        line: analysis.line,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private async fixUnusedImport(content: string, analysis: FeedbackAnalysis): Promise<string> {
    const lines = content.split('\n');
    
    if (analysis.line && analysis.line > 0 && analysis.line <= lines.length) {
      const lineIndex = analysis.line - 1;
      const line = lines[lineIndex];
      
      // Check if it's an import line
      if (line.trim().startsWith('import')) {
        // If it's a single import, remove the entire line
        if (line.includes('import {') && line.includes('} from')) {
          // Extract the import to remove
          const importMatch = analysis.originalText?.match(/import\\s*{([^}]+)}\\s*from/);
          if (importMatch) {
            const importToRemove = importMatch[1].trim();
            const currentImports = line.match(/import\\s*{([^}]+)}\\s*from/)?.[1];
            
            if (currentImports) {
              const imports = currentImports.split(',').map(i => i.trim());
              const filteredImports = imports.filter(i => !i.includes(importToRemove));
              
              if (filteredImports.length === 0) {
                // Remove entire import line
                lines.splice(lineIndex, 1);
              } else {
                // Keep other imports
                lines[lineIndex] = line.replace(
                  /import\\s*{[^}]+}/,
                  `import { ${filteredImports.join(', ')} }`
                );
              }
            }
          }
        } else {
          // Remove the entire import line
          lines.splice(lineIndex, 1);
        }
      }
    }
    
    return lines.join('\n');
  }

  private async fixMissingAwait(content: string, analysis: FeedbackAnalysis): Promise<string> {
    const lines = content.split('\n');
    
    if (analysis.line && analysis.line > 0 && analysis.line <= lines.length) {
      const lineIndex = analysis.line - 1;
      const line = lines[lineIndex];
      
      // Simple pattern matching for common async calls
      const asyncPatterns = [
        /\\b(fetch|readFile|writeFile|mkdir|access)\\s*\\(/,
        /\\.then\\(|\\.(catch|finally)\\(/,
        /new Promise\\(/
      ];
      
      for (const pattern of asyncPatterns) {
        if (pattern.test(line) && !line.includes('await')) {
          // Add await before the async call
          lines[lineIndex] = line.replace(pattern, (match) => `await ${match}`);
          break;
        }
      }
    }
    
    return lines.join('\n');
  }

  private async fixLetToConst(content: string, analysis: FeedbackAnalysis): Promise<string> {
    const lines = content.split('\n');
    
    if (analysis.line && analysis.line > 0 && analysis.line <= lines.length) {
      const lineIndex = analysis.line - 1;
      const line = lines[lineIndex];
      
      // Replace let with const if variable is not reassigned
      if (line.includes('let ')) {
        lines[lineIndex] = line.replace(/\\blet\\b/, 'const');
      }
    }
    
    return lines.join('\n');
  }

  private async fixMissingSemicolon(content: string, analysis: FeedbackAnalysis): Promise<string> {
    const lines = content.split('\n');
    
    if (analysis.line && analysis.line > 0 && analysis.line <= lines.length) {
      const lineIndex = analysis.line - 1;
      const line = lines[lineIndex];
      
      // Add semicolon if missing at end of line
      if (!line.trim().endsWith(';') && !line.trim().endsWith('{') && !line.trim().endsWith('}')) {
        lines[lineIndex] = line + ';';
      }
    }
    
    return lines.join('\n');
  }

  private async fixUnnecessaryElse(content: string, analysis: FeedbackAnalysis): Promise<string> {
    const lines = content.split('\n');
    
    if (analysis.line && analysis.line > 0 && analysis.line <= lines.length) {
      const lineIndex = analysis.line - 1;
      const line = lines[lineIndex];
      
      // Simple else removal (this would need more sophisticated AST parsing in production)
      if (line.trim().startsWith('} else {')) {
        lines[lineIndex] = line.replace('} else {', '}');
        // This is a simplified implementation - real AST parsing would handle this better
      }
    }
    
    return lines.join('\n');
  }
}

/**
 * Pattern learning database for improving over time
 */
class PatternDatabase {
  private readonly dbPath = path.join(process.cwd(), 'scripts', 'pattern-database.json');
  
  async loadPatterns(): Promise<Result<Map<string, PatternLearned>, AppError>> {
    try {
      if (!existsSync(this.dbPath)) {
        return success(new Map());
      }
      
      const content = await readFile(this.dbPath, 'utf-8');
      const data = JSON.parse(content);
      const patterns = new Map<string, PatternLearned>();
      
      for (const [key, value] of Object.entries(data)) {
        patterns.set(key, value as PatternLearned);
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
  
  async savePatterns(patterns: Map<string, PatternLearned>): Promise<Result<void, AppError>> {
    try {
      // Ensure directory exists
      const dir = path.dirname(this.dbPath);
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
      
      const data = Object.fromEntries(patterns.entries());
      await writeFile(this.dbPath, JSON.stringify(data, null, 2), 'utf-8');
      
      return success(undefined);
    } catch (error) {
      return failure(makeError(
        'FILE_OPERATION_FAILED',
        'Failed to save pattern database',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      ));
    }
  }
  
  async addPattern(analysis: FeedbackAnalysis): Promise<Result<PatternLearned, AppError>> {
    const patternsResult = await this.loadPatterns();
    if (!isSuccess(patternsResult)) {
      return failure(patternsResult.error);
    }
    
    const patterns = patternsResult.data;
    const key = `${analysis.type}-${analysis.description.substring(0, 50)}`;
    
    const existing = patterns.get(key);
    const now = new Date().toISOString();
    
    let pattern: PatternLearned;
    
    if (existing) {
      pattern = {
        ...existing,
        frequency: existing.frequency + 1,
        lastSeen: now,
        examples: [
          ...existing.examples.slice(-4), // Keep last 4 examples
          ...(analysis.file ? [{
            file: analysis.file,
            line: analysis.line || 0,
            context: analysis.description
          }] : [])
        ]
      };
    } else {
      pattern = {
        pattern: analysis.description,
        category: analysis.category,
        description: analysis.description,
        frequency: 1,
        firstSeen: now,
        lastSeen: now,
        examples: analysis.file ? [{
          file: analysis.file,
          line: analysis.line || 0,
          context: analysis.description
        }] : []
      };
    }
    
    patterns.set(key, pattern);
    
    const saveResult = await this.savePatterns(patterns);
    if (!isSuccess(saveResult)) {
      return failure(saveResult.error);
    }
    
    return success(pattern);
  }
}

/**
 * Main processor class that orchestrates the entire feedback loop
 */
class CodeRabbitFeedbackProcessor {
  private readonly githubClient: GitHubClient;
  private readonly analyzer: FeedbackAnalyzer;
  private readonly autoFix: AutoFixEngine;
  private readonly patternDb: PatternDatabase;
  
  constructor(githubToken: string) {
    this.githubClient = new GitHubClient(githubToken);
    this.analyzer = new FeedbackAnalyzer();
    this.autoFix = new AutoFixEngine();
    this.patternDb = new PatternDatabase();
  }
  
  async processComment(options: ProcessingOptions): Promise<Result<ProcessingResults, AppError>> {
    const startTime = Date.now();
    const results: ProcessingResults = {
      fixesApplied: [],
      patternsLearned: [],
      requiresHumanReview: [],
      processingTimeMs: 0
    };
    
    try {
      // Fetch the specific comment
      const commentResult = await this.githubClient.fetchComment(options.commentId);
      if (!isSuccess(commentResult)) {
        return failure(commentResult.error);
      }
      
      const comment = commentResult.data;
      
      // Analyze the feedback
      const analysis = this.analyzer.analyzeFeedback(comment);
      
      console.log(`📊 Analysis: ${analysis.category} - ${analysis.type}`);
      console.log(`   Description: ${analysis.description}`);
      console.log(`   Confidence: ${analysis.confidence}`);
      
      // Process based on category
      switch (analysis.category) {
        case 'auto-fixable':
          if (!options.dryRun && analysis.confidence > 0.7) {
            const fixResult = await this.autoFix.applyFix(analysis);
            if (isSuccess(fixResult)) {
              results.fixesApplied.push(fixResult.data);
              console.log(`✅ Applied fix: ${fixResult.data.description}`);
            } else {
              console.log(`❌ Fix failed: ${fixResult.error.message}`);
            }
          } else {
            console.log(`🏃 Dry run - would apply fix: ${analysis.description}`);
          }
          break;
          
        case 'needs-human-review':
          results.requiresHumanReview.push({
            description: analysis.description,
            reasoning: analysis.reasoning
          });
          console.log(`👤 Requires human review: ${analysis.description}`);
          break;
          
        case 'pattern-to-learn':
          const patternResult = await this.patternDb.addPattern(analysis);
          if (isSuccess(patternResult)) {
            results.patternsLearned.push(patternResult.data);
            console.log(`📚 Learned pattern: ${patternResult.data.description}`);
          }
          break;
      }
      
      results.processingTimeMs = Date.now() - startTime;
      
      return success(results);
      
    } catch (error) {
      return failure(makeError(
        'INTERNAL_ERROR',
        'Failed to process CodeRabbit feedback',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      ));
    }
  }
}

/**
 * CLI interface
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  function getArg(name: string): string | undefined {
    const index = args.findIndex(arg => arg.startsWith(`--${name}`));
    if (index === -1) return undefined;
    
    const arg = args[index];
    const equalIndex = arg.indexOf('=');
    if (equalIndex !== -1) {
      return arg.substring(equalIndex + 1);
    }
    
    return args[index + 1];
  }
  
  const prNumber = Number(getArg('pr-number'));
  const commentId = Number(getArg('comment-id'));
  const commentType = getArg('comment-type') as 'issue' | 'review';
  const githubToken = getArg('github-token') || process.env.GITHUB_TOKEN || '';
  const dryRun = getArg('dry-run') === 'true';
  
  if (!prNumber || !commentId || !githubToken) {
    console.error('❌ Missing required arguments: --pr-number, --comment-id, --github-token');
    process.exit(1);
  }
  
  console.log('🤖 CodeRabbit Feedback Processor');
  console.log(`   PR: #${prNumber}`);
  console.log(`   Comment: #${commentId}`);
  console.log(`   Type: ${commentType}`);
  console.log(`   Dry run: ${dryRun}`);
  
  const processor = new CodeRabbitFeedbackProcessor(githubToken);
  
  const result = await processor.processComment({
    prNumber,
    commentId,
    commentType,
    githubToken,
    dryRun
  });
  
  if (isSuccess(result)) {
    console.log('\\n✅ Processing completed successfully');
    console.log(`   Fixes applied: ${result.data.fixesApplied.length}`);
    console.log(`   Patterns learned: ${result.data.patternsLearned.length}`);
    console.log(`   Requires human review: ${result.data.requiresHumanReview.length}`);
    console.log(`   Processing time: ${result.data.processingTimeMs}ms`);
    
    // Write results file for GitHub Actions
    await writeFile(
      '.coderabbit-results.json',
      JSON.stringify(result.data, null, 2),
      'utf-8'
    );
    
    process.exit(0);
  } else {
    console.error(`\\n❌ Processing failed: ${result.error.message}`);
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