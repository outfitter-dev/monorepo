#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { glob } from 'glob';

/**
 * Removes hard line wraps from prose paragraphs in markdown content, preserving markdown structural elements such as code blocks, lists, headers, tables, block quotes, horizontal rules, and intentional line breaks.
 * @param {string} content - The markdown content to process.
 * @return {string} The markdown content with prose paragraphs unwrapped and markdown structure intact.
 */
function unwrapMarkdownProse(content) {
  const lines = content.split('\n');
  const result = [];
  let inCodeBlock = false;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track code block state
    if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      i++;
      continue;
    }

    // If we're in a code block, preserve everything
    if (inCodeBlock) {
      result.push(line);
      i++;
      continue;
    }

    // Preserve headers
    if (trimmed.startsWith('#')) {
      result.push(line);
      i++;
      continue;
    }

    // Preserve list items
    if (/^[\s]*[-*+]\s/.test(line) || /^[\s]*\d+\.\s/.test(line)) {
      // Unwrap hard-wrapped lines within a list item
      const listItemLines = [line];
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j];
        // If next line is indented (continuation of list item) or blank, join it
        if (/^\s+$/.test(nextLine)) {
          listItemLines.push('');
          j++;
          continue;
        }
        // If next line is indented (at least 2 spaces or a tab), treat as continuation
        if (/^\s{2,}\S/.test(nextLine) || /^\t+\S/.test(nextLine)) {
          listItemLines.push(nextLine.trim());
          j++;
          continue;
        }
        // If next line is NOT a new list item, header, code block, blockquote, table, or horizontal rule, treat as continuation
        const nextTrimmed = nextLine.trim();
        if (
          nextTrimmed === '' ||
          nextTrimmed.startsWith('#') ||
          nextTrimmed.startsWith('```') ||
          nextTrimmed.startsWith('~~~') ||
          /^[\s]*[-*+]\s/.test(nextLine) ||
          /^[\s]*\d+\.\s/.test(nextLine) ||
          nextLine.includes('|') ||
          nextTrimmed.startsWith('>') ||
          /^[\s]*-{3,}[\s]*$/.test(nextLine) ||
          /^[\s]*\*{3,}[\s]*$/.test(nextLine)
        ) {
          break;
        }
        // Otherwise, treat as continuation of the list item
        listItemLines.push(nextLine.trim());
        j++;
      }
      // Join the list item lines, preserving the marker and unwrapping prose
      const firstLine = listItemLines[0];
      const markerMatch = firstLine.match(/^([\s]*([-*+]\s|\d+\.\s))/);
      const marker = markerMatch ? markerMatch[1] : '';
      const content = listItemLines
        .map((l, idx) =>
          idx === 0 ? l.replace(/^([\s]*([-*+]\s|\d+\.\s))/, '') : l
        )
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      result.push(`${marker}${content}`);
      i = j;
      continue;
    }

    // Preserve tables (lines with |)
    if (line.includes('|') && line.trim().length > 0) {
      result.push(line);
      i++;
      continue;
    }

    // Preserve empty lines and lines with only whitespace
    if (trimmed === '') {
      result.push(line);
      i++;
      continue;
    }

    // Preserve lines that end with double space (intentional line break)
    if (line.endsWith('  ')) {
      result.push(line);
      i++;
      continue;
    }

    // Preserve block quotes
    if (trimmed.startsWith('>')) {
      result.push(line);
      i++;
      continue;
    }

    // Preserve horizontal rules
    if (/^[\s]*-{3,}[\s]*$/.test(line) || /^[\s]*\*{3,}[\s]*$/.test(line)) {
      result.push(line);
      i++;
      continue;
    }

    // Now handle prose paragraphs
    if (trimmed.length > 0) {
      // Start collecting lines for this paragraph
      const paragraphLines = [line];
      let j = i + 1;

      // Look ahead to collect continuation lines
      while (j < lines.length) {
        const nextLine = lines[j];
        const nextTrimmed = nextLine.trim();

        // Stop if we hit an empty line (end of paragraph)
        if (nextTrimmed === '') {
          break;
        }

        // Stop if we hit a special line type
        if (
          nextTrimmed.startsWith('#') || // Header
          nextTrimmed.startsWith('```') || // Code block
          nextTrimmed.startsWith('~~~') || // Code block
          /^[\s]*[-*+]\s/.test(nextLine) || // List item
          /^[\s]*\d+\.\s/.test(nextLine) || // Numbered list
          nextLine.includes('|') || // Table
          nextTrimmed.startsWith('>') || // Block quote
          /^[\s]*-{3,}[\s]*$/.test(nextLine) || // Horizontal rule
          /^[\s]*\*{3,}[\s]*$/.test(nextLine) // Horizontal rule
        ) {
          break;
        }

        paragraphLines.push(nextLine);
        j++;
      }

      // Join the paragraph lines, removing hard wraps
      const unwrappedParagraph = paragraphLines
        .map((line) => line.trim())
        .join(' ')
        .trim();

      if (unwrappedParagraph.length > 0) {
        result.push(unwrappedParagraph);
      }

      i = j; // Skip the lines we just processed
    } else {
      i++;
    }
  }

  return result.join('\n');
}

/**
 * Unwraps hard-wrapped prose in a markdown file and writes changes if needed.
 * @param {string} filePath - Path to the markdown file to process.
 * @return {Promise<boolean>} Resolves to true if the file was modified, false otherwise or on error.
 */
async function processFile(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    const unwrapped = unwrapMarkdownProse(content);

    // Only write if content changed
    if (unwrapped !== content) {
      await writeFile(filePath, unwrapped, 'utf-8');
      console.log(`✅ Unwrapped: ${filePath}`);
      return true;
    }
      console.log(`⏭️  No changes: ${filePath}`);
      return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

/**
 * Entry point for the command-line tool to unwrap hard-wrapped prose in markdown files.
 *
 * Parses command-line arguments to determine which markdown files to process and which options to apply, such as dry-run or processing all files in the repository. Displays usage instructions if requested. Processes each file by unwrapping prose paragraphs while preserving markdown structure, either previewing changes or applying them. Logs a summary of results and provides guidance for applying changes if run in dry-run mode.
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node scripts/unwrap-markdown-prose.mjs [options] [files...]

Options:
  --dry-run    Show what would be changed without modifying files
  --all        Process all markdown files in the repo
  --help, -h   Show this help

Examples:
  node scripts/unwrap-markdown-prose.mjs README.md
  node scripts/unwrap-markdown-prose.mjs --all
  node scripts/unwrap-markdown-prose.mjs --dry-run docs/**/*.md
`);
    return;
  }

  const isDryRun = args.includes('--dry-run');
  const processAll = args.includes('--all');

  let filePaths;

  if (processAll) {
    // Find all markdown files, excluding some directories
    filePaths = await glob('**/*.md', {
      ignore: [
        'node_modules/**',
        '**/node_modules/**',
        '.git/**',
        'dist/**',
        'build/**',
        '**/dist/**',
        '**/build/**',
      ],
    });
  } else {
    // Use provided file paths, filtering out options
    filePaths = args.filter((arg) => !arg.startsWith('--'));

    if (filePaths.length === 0) {
      console.error('❌ No files specified. Use --all or provide file paths.');
      process.exit(1);
    }
  }

  console.log(
    `🔍 Processing ${filePaths.length} files${isDryRun ? ' (dry run)' : ''}...\n`
  );

  let processedCount = 0;
  let changedCount = 0;

  for (const filePath of filePaths) {
    if (isDryRun) {
      try {
        const content = await readFile(filePath, 'utf-8');
        const unwrapped = unwrapMarkdownProse(content);

        if (unwrapped !== content) {
          console.log(`🔄 Would change: ${filePath}`);
          changedCount++;
        } else {
          console.log(`⏭️  No changes: ${filePath}`);
        }
        processedCount++;
      } catch (error) {
        console.error(`❌ Error reading ${filePath}:`, error.message);
      }
    } else {
      const changed = await processFile(filePath);
      if (changed) changedCount++;
      processedCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   Processed: ${processedCount} files`);
  console.log(
    `   ${isDryRun ? 'Would change' : 'Changed'}: ${changedCount} files`
  );

  if (isDryRun && changedCount > 0) {
    console.log('\n💡 Run without --dry-run to apply changes');
  }
}

main().catch(console.error);
