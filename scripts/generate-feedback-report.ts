#!/usr/bin/env bun

/**
 * CodeRabbit Feedback Analytics Dashboard
 * 
 * Generates comprehensive reports on feedback patterns, fix success rates,
 * and tooling improvement suggestions based on learned patterns.
 */

import { writeFile, readFile } from 'node:fs/promises';
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

// Types for analytics
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

interface FeedbackMetrics {
  totalPatterns: number;
  totalOccurrences: number;
  categoryCounts: Record<string, number>;
  typeCounts: Record<string, number>;
  frequencyDistribution: Record<string, number>;
  timelineTrends: Array<{
    date: string;
    newPatterns: number;
    totalOccurrences: number;
  }>;
  topPatterns: PatternLearned[];
  improvementOpportunities: Array<{
    pattern: string;
    frequency: number;
    suggestedAction: string;
    impact: 'high' | 'medium' | 'low';
  }>;
}

interface ToolingEffectiveness {
  biomeRules: Array<{
    rule: string;
    patternsAddressed: number;
    effectivenessScore: number;
  }>;
  customRules: Array<{
    rule: string;
    createdDate: string;
    matchesFound: number;
  }>;
  preventionRate: number;
  configurationHealth: 'excellent' | 'good' | 'needs-improvement' | 'poor';
}

/**
 * Analytics engine for processing feedback patterns
 */
class FeedbackAnalytics {
  
  async generateMetrics(patterns: Map<string, PatternLearned>): Promise<FeedbackMetrics> {
    const totalPatterns = patterns.size;
    const totalOccurrences = Array.from(patterns.values()).reduce((sum, p) => sum + p.frequency, 0);
    
    // Category distribution
    const categoryCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    const frequencyDistribution: Record<string, number> = {
      'low (1-2)': 0,
      'medium (3-5)': 0,
      'high (6-10)': 0,
      'critical (>10)': 0
    };
    
    for (const pattern of patterns.values()) {
      categoryCounts[pattern.category] = (categoryCounts[pattern.category] || 0) + pattern.frequency;
      
      // Extract type from description for better analytics
      const type = this.extractPatternType(pattern.description);
      typeCounts[type] = (typeCounts[type] || 0) + pattern.frequency;
      
      // Frequency distribution
      if (pattern.frequency <= 2) {
        frequencyDistribution['low (1-2)']++;
      } else if (pattern.frequency <= 5) {
        frequencyDistribution['medium (3-5)']++;
      } else if (pattern.frequency <= 10) {
        frequencyDistribution['high (6-10)']++;
      } else {
        frequencyDistribution['critical (>10)']++;
      }
    }
    
    // Generate timeline trends (simplified for now)
    const timelineTrends = this.generateTimelineTrends(patterns);
    
    // Get top patterns by frequency
    const topPatterns = Array.from(patterns.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
    
    // Identify improvement opportunities
    const improvementOpportunities = this.identifyImprovementOpportunities(patterns);
    
    return {
      totalPatterns,
      totalOccurrences,
      categoryCounts,
      typeCounts,
      frequencyDistribution,
      timelineTrends,
      topPatterns,
      improvementOpportunities
    };
  }
  
  private extractPatternType(description: string): string {
    if (description.toLowerCase().includes('unused import')) return 'unused-imports';
    if (description.toLowerCase().includes('await')) return 'async-await';
    if (description.toLowerCase().includes('const') && description.toLowerCase().includes('let')) return 'variable-declarations';
    if (description.toLowerCase().includes('type') && description.toLowerCase().includes('annotation')) return 'type-annotations';
    if (description.toLowerCase().includes('accessibility') || description.toLowerCase().includes('a11y')) return 'accessibility';
    if (description.toLowerCase().includes('performance')) return 'performance';
    if (description.toLowerCase().includes('security')) return 'security';
    if (description.toLowerCase().includes('test')) return 'testing';
    return 'other';
  }
  
  private generateTimelineTrends(patterns: Map<string, PatternLearned>): Array<{
    date: string;
    newPatterns: number;
    totalOccurrences: number;
  }> {
    const trends: Record<string, { newPatterns: number; totalOccurrences: number }> = {};
    
    for (const pattern of patterns.values()) {
      const date = pattern.firstSeen.split('T')[0]; // Extract date part
      if (!trends[date]) {
        trends[date] = { newPatterns: 0, totalOccurrences: 0 };
      }
      trends[date].newPatterns++;
      trends[date].totalOccurrences += pattern.frequency;
    }
    
    return Object.entries(trends)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 entries
  }
  
  private identifyImprovementOpportunities(patterns: Map<string, PatternLearned>): Array<{
    pattern: string;
    frequency: number;
    suggestedAction: string;
    impact: 'high' | 'medium' | 'low';
  }> {
    const opportunities = [];
    
    for (const pattern of patterns.values()) {
      if (pattern.frequency >= 5) {
        let suggestedAction = '';
        let impact: 'high' | 'medium' | 'low' = 'low';
        
        if (pattern.category === 'auto-fixable') {
          suggestedAction = 'Add automated linting rule to prevent this issue';
          impact = pattern.frequency >= 10 ? 'high' : 'medium';
        } else if (pattern.category === 'pattern-to-learn') {
          suggestedAction = 'Create custom lint rule or documentation';
          impact = pattern.frequency >= 8 ? 'medium' : 'low';
        } else {
          suggestedAction = 'Add to code review checklist';
          impact = 'medium';
        }
        
        opportunities.push({
          pattern: pattern.description,
          frequency: pattern.frequency,
          suggestedAction,
          impact
        });
      }
    }
    
    return opportunities.sort((a, b) => b.frequency - a.frequency);
  }
  
  async assessToolingEffectiveness(patterns: Map<string, PatternLearned>): Promise<ToolingEffectiveness> {
    // Load current Biome configuration to assess effectiveness
    const biomeConfig = await this.loadBiomeConfig();
    
    // Analyze which patterns could be prevented by current/potential rules
    const biomeRules = this.analyzeBiomeRulesEffectiveness(patterns, biomeConfig);
    
    // Check for existing custom rules
    const customRules = await this.analyzeCustomRules(patterns);
    
    // Calculate prevention rate (how many issues current tooling would catch)
    const preventionRate = this.calculatePreventionRate(patterns, biomeConfig);
    
    // Assess overall configuration health
    const configurationHealth = this.assessConfigurationHealth(preventionRate, patterns.size);
    
    return {
      biomeRules,
      customRules,
      preventionRate,
      configurationHealth
    };
  }
  
  private async loadBiomeConfig(): Promise<Record<string, unknown>> {
    const paths = [
      'biome.enhanced.json',
      'biome.json'
    ];
    
    for (const configPath of paths) {
      if (existsSync(configPath)) {
        try {
          const content = await readFile(configPath, 'utf-8');
          return JSON.parse(content);
        } catch {
          continue;
        }
      }
    }
    
    return {}; // Default empty config
  }
  
  private analyzeBiomeRulesEffectiveness(
    patterns: Map<string, PatternLearned>, 
    biomeConfig: Record<string, unknown>
  ): Array<{
    rule: string;
    patternsAddressed: number;
    effectivenessScore: number;
  }> {
    const rules = [];
    
    // Map patterns to potential Biome rules
    const rulePatternMap = new Map([
      ['correctness/noUnusedImports', ['unused import']],
      ['suspicious/noFloatingPromises', ['missing await', 'floating promise']],
      ['style/useConst', ['let', 'const']],
      ['correctness/useValidForDirection', ['for loop']],
      ['a11y/useValidAriaProps', ['accessibility', 'aria']],
      ['performance/noAccumulatingSpread', ['spread operator', 'performance']]
    ]);
    
    for (const [rule, keywords] of rulePatternMap.entries()) {
      const matchingPatterns = Array.from(patterns.values()).filter(pattern =>
        keywords.some(keyword => pattern.description.toLowerCase().includes(keyword))
      );
      
      const patternsAddressed = matchingPatterns.reduce((sum, p) => sum + p.frequency, 0);
      const effectivenessScore = Math.min(1.0, patternsAddressed / 100); // Normalize to 0-1
      
      if (patternsAddressed > 0) {
        rules.push({
          rule,
          patternsAddressed,
          effectivenessScore
        });
      }
    }
    
    return rules.sort((a, b) => b.patternsAddressed - a.patternsAddressed);
  }
  
  private async analyzeCustomRules(patterns: Map<string, PatternLearned>): Promise<Array<{
    rule: string;
    createdDate: string;
    matchesFound: number;
  }>> {
    // This would analyze existing custom rules
    // For now, return empty array
    return [];
  }
  
  private calculatePreventionRate(
    patterns: Map<string, PatternLearned>,
    biomeConfig: Record<string, unknown>
  ): number {
    const totalOccurrences = Array.from(patterns.values()).reduce((sum, p) => sum + p.frequency, 0);
    
    // Estimate how many issues current tooling would prevent
    // This is a simplified calculation
    let preventableOccurrences = 0;
    
    for (const pattern of patterns.values()) {
      if (pattern.category === 'auto-fixable') {
        // Assume 80% of auto-fixable issues could be prevented with proper tooling
        preventableOccurrences += Math.floor(pattern.frequency * 0.8);
      }
    }
    
    return totalOccurrences > 0 ? (preventableOccurrences / totalOccurrences) * 100 : 0;
  }
  
  private assessConfigurationHealth(preventionRate: number, totalPatterns: number): 'excellent' | 'good' | 'needs-improvement' | 'poor' {
    if (preventionRate >= 80 && totalPatterns < 10) return 'excellent';
    if (preventionRate >= 60 && totalPatterns < 20) return 'good';
    if (preventionRate >= 40 || totalPatterns < 50) return 'needs-improvement';
    return 'poor';
  }
}

/**
 * Report generator for creating human-readable feedback reports
 */
class ReportGenerator {
  
  async generateMarkdownReport(
    metrics: FeedbackMetrics, 
    effectiveness: ToolingEffectiveness
  ): Promise<string> {
    const report = `# CodeRabbit Feedback Analysis Report

Generated on: ${new Date().toISOString()}

## 📊 Overview

- **Total Patterns Identified**: ${metrics.totalPatterns}
- **Total Pattern Occurrences**: ${metrics.totalOccurrences}
- **Prevention Rate**: ${effectiveness.preventionRate.toFixed(1)}%
- **Configuration Health**: ${this.formatHealthBadge(effectiveness.configurationHealth)}

## 📈 Pattern Categories

| Category | Occurrences | Percentage |
|----------|-------------|------------|
${Object.entries(metrics.categoryCounts)
  .sort(([,a], [,b]) => b - a)
  .map(([category, count]) => {
    const percentage = ((count / metrics.totalOccurrences) * 100).toFixed(1);
    return `| ${category} | ${count} | ${percentage}% |`;
  })
  .join('\\n')}

## 🔍 Most Common Pattern Types

| Type | Occurrences | Impact |
|------|-------------|--------|
${Object.entries(metrics.typeCounts)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10)
  .map(([type, count]) => {
    const impact = count >= 20 ? '🔴 High' : count >= 10 ? '🟡 Medium' : '🟢 Low';
    return `| ${type} | ${count} | ${impact} |`;
  })
  .join('\\n')}

## 📊 Frequency Distribution

${Object.entries(metrics.frequencyDistribution)
  .map(([range, count]) => `- **${range}**: ${count} patterns`)
  .join('\\n')}

## 🏆 Top 10 Most Frequent Patterns

${metrics.topPatterns
  .map((pattern, index) => `${index + 1}. **${pattern.description}** (${pattern.frequency} occurrences)
   - Category: ${pattern.category}
   - First seen: ${new Date(pattern.firstSeen).toLocaleDateString()}
   - Files affected: ${pattern.examples.length}`)
  .join('\\n\\n')}

## 🎯 Improvement Opportunities

${metrics.improvementOpportunities
  .map(opp => `### ${this.formatImpactBadge(opp.impact)} ${opp.pattern}
- **Frequency**: ${opp.frequency} occurrences
- **Suggested Action**: ${opp.suggestedAction}`)
  .join('\\n\\n')}

## 🔧 Tooling Effectiveness

### Biome Rules Analysis

${effectiveness.biomeRules.length > 0 ? 
  effectiveness.biomeRules
    .map(rule => `- **${rule.rule}**: Could address ${rule.patternsAddressed} occurrences (${(rule.effectivenessScore * 100).toFixed(1)}% effectiveness)`)
    .join('\\n') :
  '- No specific rule recommendations identified'
}

### Custom Rules

${effectiveness.customRules.length > 0 ?
  effectiveness.customRules
    .map(rule => `- **${rule.rule}**: ${rule.matchesFound} matches found`)
    .join('\\n') :
  '- No custom rules currently implemented'
}

## 📈 Timeline Trends (Last 30 Days)

${metrics.timelineTrends.length > 0 ?
  `| Date | New Patterns | Total Occurrences |
|------|--------------|-------------------|
${metrics.timelineTrends
  .slice(-10) // Show last 10 entries
  .map(trend => `| ${trend.date} | ${trend.newPatterns} | ${trend.totalOccurrences} |`)
  .join('\\n')}` :
  'No timeline data available'
}

## 🚀 Recommended Actions

${this.generateRecommendations(metrics, effectiveness)}

## 📝 Notes

- This report is automatically generated from CodeRabbit feedback patterns
- Prevention rate is estimated based on current tooling configuration
- High-frequency patterns should be prioritized for tooling improvements
- Consider reviewing patterns marked as "needs-human-review" for process improvements

---

*Report generated by CodeRabbit Feedback Loop System*`;

    return report;
  }
  
  private formatHealthBadge(health: string): string {
    const badges = {
      'excellent': '🟢 Excellent',
      'good': '🟡 Good',
      'needs-improvement': '🟠 Needs Improvement',
      'poor': '🔴 Poor'
    };
    return badges[health as keyof typeof badges] || health;
  }
  
  private formatImpactBadge(impact: string): string {
    const badges = {
      'high': '🔴 High Impact',
      'medium': '🟡 Medium Impact',
      'low': '🟢 Low Impact'
    };
    return badges[impact as keyof typeof badges] || impact;
  }
  
  private generateRecommendations(metrics: FeedbackMetrics, effectiveness: ToolingEffectiveness): string {
    const recommendations = [];
    
    if (effectiveness.preventionRate < 50) {
      recommendations.push('1. **Improve prevention tooling**: Current prevention rate is below 50%. Consider adding more automated linting rules.');
    }
    
    if (metrics.improvementOpportunities.filter(op => op.impact === 'high').length > 0) {
      recommendations.push('2. **Address high-impact patterns**: Several patterns have high frequency and could benefit from immediate tooling improvements.');
    }
    
    if (Object.values(metrics.categoryCounts)['auto-fixable'] > 30) {
      recommendations.push('3. **Enhance auto-fixing**: Many auto-fixable patterns detected. Consider expanding automated fixes in CI/CD.');
    }
    
    if (effectiveness.configurationHealth === 'poor') {
      recommendations.push('4. **Configuration overhaul**: Current tooling configuration needs significant improvement to prevent issues.');
    }
    
    const unusedImportCount = metrics.typeCounts['unused-imports'] || 0;
    if (unusedImportCount > 10) {
      recommendations.push(`5. **Unused imports**: ${unusedImportCount} unused import issues detected. Enable \\`noUnusedImports\\` rule.`);
    }
    
    if (recommendations.length === 0) {
      recommendations.push('🎉 **Great job!** Your current tooling configuration appears to be working well. Continue monitoring for new patterns.');
    }
    
    return recommendations.join('\\n\\n');
  }
  
  async generateJsonReport(metrics: FeedbackMetrics, effectiveness: ToolingEffectiveness): Promise<string> {
    const report = {
      generated: new Date().toISOString(),
      summary: {
        totalPatterns: metrics.totalPatterns,
        totalOccurrences: metrics.totalOccurrences,
        preventionRate: effectiveness.preventionRate,
        configurationHealth: effectiveness.configurationHealth
      },
      metrics,
      effectiveness,
      metadata: {
        version: '1.0.0',
        generator: 'CodeRabbit Feedback Loop System'
      }
    };
    
    return JSON.stringify(report, null, 2);
  }
}

/**
 * Main dashboard class that orchestrates report generation
 */
class FeedbackDashboard {
  private readonly analytics: FeedbackAnalytics;
  private readonly reportGenerator: ReportGenerator;
  
  constructor() {
    this.analytics = new FeedbackAnalytics();
    this.reportGenerator = new ReportGenerator();
  }
  
  async generateReport(format: 'markdown' | 'json' | 'both' = 'markdown'): Promise<Result<void, AppError>> {
    try {
      console.log('📊 Generating CodeRabbit Feedback Analytics Report...');
      
      // Load pattern database
      const patterns = await this.loadPatternDatabase();
      if (patterns.size === 0) {
        console.log('ℹ️ No patterns found in database. Run some CodeRabbit feedback processing first.');
        return success(undefined);
      }
      
      console.log(`📈 Analyzing ${patterns.size} patterns...`);
      
      // Generate metrics
      const metrics = await this.analytics.generateMetrics(patterns);
      const effectiveness = await this.analytics.assessToolingEffectiveness(patterns);
      
      console.log('📝 Generating reports...');
      
      // Generate reports based on format
      const timestamp = new Date().toISOString().split('T')[0];
      
      if (format === 'markdown' || format === 'both') {
        const markdownReport = await this.reportGenerator.generateMarkdownReport(metrics, effectiveness);
        const markdownPath = path.join('docs', 'reports', `coderabbit-feedback-${timestamp}.md`);
        
        // Ensure directory exists
        await this.ensureDirectoryExists(path.dirname(markdownPath));
        await writeFile(markdownPath, markdownReport, 'utf-8');
        
        console.log(`✅ Markdown report generated: ${markdownPath}`);
      }
      
      if (format === 'json' || format === 'both') {
        const jsonReport = await this.reportGenerator.generateJsonReport(metrics, effectiveness);
        const jsonPath = path.join('docs', 'reports', `coderabbit-feedback-${timestamp}.json`);
        
        await this.ensureDirectoryExists(path.dirname(jsonPath));
        await writeFile(jsonPath, jsonReport, 'utf-8');
        
        console.log(`✅ JSON report generated: ${jsonPath}`);
      }
      
      // Display quick summary
      console.log(`\\n📋 Quick Summary:`);
      console.log(`   Total Patterns: ${metrics.totalPatterns}`);
      console.log(`   Total Occurrences: ${metrics.totalOccurrences}`);
      console.log(`   Prevention Rate: ${effectiveness.preventionRate.toFixed(1)}%`);
      console.log(`   Configuration Health: ${effectiveness.configurationHealth}`);
      console.log(`   Improvement Opportunities: ${metrics.improvementOpportunities.length}`);
      
      return success(undefined);
      
    } catch (error) {
      return failure(makeError(
        'INTERNAL_ERROR',
        'Failed to generate feedback report',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      ));
    }
  }
  
  private async loadPatternDatabase(): Promise<Map<string, PatternLearned>> {
    const dbPath = path.join(process.cwd(), 'scripts', 'pattern-database.json');
    
    if (!existsSync(dbPath)) {
      return new Map();
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
    
    return patterns;
  }
  
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    const { mkdir } = await import('node:fs/promises');
    await mkdir(dirPath, { recursive: true });
  }
}

/**
 * CLI interface
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const format = args.includes('--json') ? 'json' : 
                args.includes('--both') ? 'both' : 'markdown';
  
  console.log('📊 CodeRabbit Feedback Analytics Dashboard');
  console.log(`   Format: ${format}`);
  
  const dashboard = new FeedbackDashboard();
  
  const result = await dashboard.generateReport(format);
  
  if (isSuccess(result)) {
    console.log('\\n✅ Report generation completed successfully!');
    console.log('\\n🔗 Next steps:');
    console.log('   - Review the generated report(s) in docs/reports/');
    console.log('   - Implement suggested tooling improvements');
    console.log('   - Share insights with the development team');
    
    process.exit(0);
  } else {
    console.error(`\\n❌ Report generation failed: ${result.error.message}`);
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