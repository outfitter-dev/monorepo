/**
 * Remark plugin to format code blocks using appropriate formatters
 * Only processes code blocks when their formatter is available
 */

import { visit } from 'unist-util-visit';
import { execSync } from 'node:child_process';
import { writeFileSync, readFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Plugin } from 'unified';
import type { Root } from 'mdast';

interface CodeBlockFormatterOptions {
  routing: {
    [language: string]: 'biome' | 'prettier' | string;
  };
  preserveIndentation?: boolean;
  verbose?: boolean;
}

// Language aliases
const languageAliases: Record<string, string> = {
  ts: 'typescript',
  js: 'javascript',
  jsx: 'javascript',
  tsx: 'typescript',
  yml: 'yaml',
};

/**
 * Check if a formatter is available
 */
function isFormatterAvailable(formatter: string): boolean {
  try {
    execSync(`${formatter} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Format code with Biome
 */
function formatWithBiome(code: string, language: string): string {
  const ext = language === 'typescript' ? '.ts' : '.js';
  const tempFile = join(tmpdir(), `biome-temp-${Date.now()}${ext}`);
  
  try {
    writeFileSync(tempFile, code);
    execSync(`biome format --write ${tempFile}`, { stdio: 'ignore' });
    return readFileSync(tempFile, 'utf8');
  } catch (error) {
    throw new Error(`Biome formatting failed: ${error}`);
  } finally {
    try { unlinkSync(tempFile); } catch {}
  }
}

/**
 * Format code with Prettier
 */
function formatWithPrettier(code: string, language: string): string {
  const parserMap: Record<string, string> = {
    javascript: 'babel',
    typescript: 'typescript',
    json: 'json',
    yaml: 'yaml',
    css: 'css',
    html: 'html',
    markdown: 'markdown',
  };
  
  const parser = parserMap[language];
  if (!parser) {
    throw new Error(`No Prettier parser for language: ${language}`);
  }
  
  try {
    return execSync(`prettier --parser ${parser}`, {
      input: code,
      encoding: 'utf8',
    }).trim();
  } catch (error) {
    throw new Error(`Prettier formatting failed: ${error}`);
  }
}

/**
 * Remark plugin to format code blocks
 */
export const remarkFormatCodeBlocks: Plugin<[CodeBlockFormatterOptions?], Root> = (options = {}) => {
  const { routing = {}, preserveIndentation = true, verbose = false } = options;
  
  // Cache formatter availability
  const formatterCache = new Map<string, boolean>();
  
  return async (tree) => {
    let formattedCount = 0;
    let skippedCount = 0;
    
    visit(tree, 'code', (node) => {
      if (!node.lang) {
        skippedCount++;
        return;
      }
      
      // Normalize language
      const language = languageAliases[node.lang] || node.lang;
      const formatter = routing[language];
      
      if (!formatter) {
        skippedCount++;
        return;
      }
      
      // Check if formatter is available (with caching)
      if (!formatterCache.has(formatter)) {
        formatterCache.set(formatter, isFormatterAvailable(formatter));
      }
      
      if (!formatterCache.get(formatter)) {
        if (verbose) {
          console.warn(`Formatter '${formatter}' not available for ${language} code block`);
        }
        skippedCount++;
        return;
      }
      
      try {
        const originalCode = node.value;
        let formattedCode: string;
        
        // Detect and preserve indentation
        let indent = '';
        if (preserveIndentation) {
          const match = originalCode.match(/^(\s*)/);
          if (match) {
            indent = match[1];
          }
        }
        
        // Strip common indentation before formatting
        const codeToFormat = originalCode
          .split('\n')
          .map(line => line.replace(new RegExp(`^${indent}`), ''))
          .join('\n');
        
        // Format based on formatter
        switch (formatter) {
          case 'biome':
            formattedCode = formatWithBiome(codeToFormat, language);
            break;
          case 'prettier':
            formattedCode = formatWithPrettier(codeToFormat, language);
            break;
          default:
            // Assume it's a custom formatter command
            formattedCode = execSync(formatter, {
              input: codeToFormat,
              encoding: 'utf8',
            }).trim();
        }
        
        // Re-apply indentation if needed
        if (preserveIndentation && indent) {
          formattedCode = formattedCode
            .split('\n')
            .map(line => (line ? indent + line : line))
            .join('\n');
        }
        
        node.value = formattedCode;
        formattedCount++;
        
      } catch (error) {
        if (verbose) {
          console.warn(`Failed to format ${language} code block:`, error);
        }
        skippedCount++;
      }
    });
    
    if (verbose) {
      console.log(`Code blocks: ${formattedCount} formatted, ${skippedCount} skipped`);
    }
  };
};

// Export for both ESM and CommonJS
export default remarkFormatCodeBlocks;

// CommonJS export for remark-cli compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = remarkFormatCodeBlocks;
  module.exports.default = remarkFormatCodeBlocks;
  module.exports.remarkFormatCodeBlocks = remarkFormatCodeBlocks;
}