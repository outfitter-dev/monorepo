#!/usr/bin/env bun
/**
 * Validates cross-references in fieldguides markdown files
 * Ensures all internal links point to existing files
 */
import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

async function findMarkdownFiles(dir) {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (
      entry.isDirectory() &&
      !entry.name.startsWith('.') &&
      entry.name !== 'node_modules'
    ) {
      files.push(...(await findMarkdownFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}
function extractLinks(content, filePath) {
  const links = [];
  const lines = content.split('\n');
  // Match markdown links: [text](path)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  lines.forEach((line, index) => {
    let match;
    const lineNumber = index + 1;
    while ((match = linkRegex.exec(line)) !== null) {
      const link = match[2];
      // Skip if link is undefined or empty
      if (!link) continue;
      // Skip external links, anchors, and non-md files
      if (
        link.startsWith('http') ||
        link.startsWith('#') ||
        link.startsWith('mailto:') ||
        !(link.endsWith('.md') || link.includes('.md#'))
      ) {
        continue;
      }
      // Extract the file path (remove anchor if present)
      const target = link.split('#')[0];
      if (!target) continue;
      const absoluteTarget = resolve(dirname(filePath), target);
      links.push({
        file: filePath,
        line: lineNumber,
        link,
        target: absoluteTarget,
        exists: existsSync(absoluteTarget),
      });
    }
  });
  return links;
}
async function validateCrossReferences() {
  console.log('🔍 Validating cross-references in fieldguides...\n');
  const fieldguidesDir = resolve(__dirname, '..', 'fieldguides');
  const markdownFiles = await findMarkdownFiles(fieldguidesDir);
  console.log(`Found ${markdownFiles.length} markdown files\n`);
  const allLinks = [];
  for (const file of markdownFiles) {
    const content = await readFile(file, 'utf-8');
    const links = extractLinks(content, file);
    allLinks.push(...links);
  }
  const brokenLinks = allLinks.filter((link) => !link.exists);
  const validLinks = allLinks.filter((link) => link.exists);
  if (brokenLinks.length > 0) {
    console.log('❌ Found broken cross-references:\n');
    const groupedByFile = brokenLinks.reduce((acc, link) => {
      const relativeFile = link.file.replace(`${fieldguidesDir}/`, '');
      if (!acc[relativeFile]) {
        acc[relativeFile] = [];
      }
      acc[relativeFile].push(link);
      return acc;
    }, {});
    for (const [file, links] of Object.entries(groupedByFile)) {
      console.log(`\n📄 ${file}:`);
      for (const link of links) {
        console.log(`  Line ${link.line}: [${link.link}] -> File not found`);
      }
    }
    console.log('\n\n📊 Summary:');
    console.log(`  Total links checked: ${allLinks.length}`);
    console.log(`  ✅ Valid links: ${validLinks.length}`);
    console.log(`  ❌ Broken links: ${brokenLinks.length}`);
    process.exit(1);
  } else {
    console.log('✅ All cross-references are valid!\n');
    console.log('📊 Summary:');
    console.log(`  Total links checked: ${allLinks.length}`);
    console.log('  All links point to existing files');
  }
  // Optional: Check for bidirectional references
  console.log('\n🔄 Checking for missing bidirectional references...\n');
  const fileReferences = new Map();
  // Build reference map
  for (const link of validLinks) {
    const source = link.file.replace(`${fieldguidesDir}/`, '');
    const target = link.target.replace(`${fieldguidesDir}/`, '');
    if (!fileReferences.has(source)) {
      fileReferences.set(source, new Set());
    }
    fileReferences.get(source)?.add(target);
  }
  // Check for missing reverse references
  const missingReverse = [];
  for (const [source, targets] of fileReferences.entries()) {
    for (const target of targets) {
      const targetRefs = fileReferences.get(target);
      if (!targetRefs?.has(source)) {
        // Only suggest bidirectional refs for files in same directory level
        const sourceDir = dirname(source).split('/')[0];
        const targetDir = dirname(target).split('/')[0];
        if (sourceDir === targetDir) {
          missingReverse.push({ source, target });
        }
      }
    }
  }
  if (missingReverse.length > 0) {
    console.log('💡 Potential missing bidirectional references:\n');
    for (const { source, target } of missingReverse) {
      console.log(`  ${target} could reference → ${source}`);
    }
  } else {
    console.log('✅ All appropriate files have bidirectional references');
  }
}
// Run validation
validateCrossReferences().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
//# sourceMappingURL=validate-cross-references.js.map
