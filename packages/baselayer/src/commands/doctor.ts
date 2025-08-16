import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Result } from '@outfitter/contracts';
import { failure, isFailure, makeError, success } from '@outfitter/contracts';
import { detectExistingTools } from '../core/detector.js';
import type { DoctorIssue, DoctorReport } from '../types.js';

interface ToolVersion {
  tool: string;
  version: string | null;
  required: string;
}

/**
 * Diagnose configuration issues
 */
export async function doctor(): Promise<Result<DoctorReport, Error>> {
  try {
    const projectRoot = process.cwd();
    const packageJsonPath = join(projectRoot, 'package.json');
    const issues: DoctorIssue[] = [];

    // Check if we're in a project
    if (!existsSync(packageJsonPath)) {
      issues.push({
        description: 'No package.json found in current directory',
        severity: 'error',
        fix: 'Run this command in a project root directory',
      });
      return success({ issues });
    }

    let packageJson: Record<string, unknown>;
    try {
      packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    } catch (_error) {
      issues.push({
        description: 'Failed to parse package.json',
        severity: 'error',
        fix: 'Check package.json for syntax errors',
      });
      return success({ issues });
    }
    const detectionResult = await detectExistingTools(projectRoot);
    if (isFailure(detectionResult)) {
      issues.push({
        description: 'Failed to detect existing configurations',
        severity: 'error',
        fix: 'Check file permissions and try again',
      });
    } else {
      const detectedTools = detectionResult.data;

      // Check for conflicting formatters
      const formatters = detectedTools.configs.filter((c) =>
        ['prettier', 'biome', 'eslint'].includes(c.tool)
      );

      if (formatters.length > 1) {
        const formatterNames = formatters.map((f) => f.tool).join(', ');
        issues.push({
          description: `Multiple formatters detected: ${formatterNames}`,
          severity: 'warning',
          fix: 'Consider using only one formatter. Run "flint clean" to remove old configs',
        });
      }

      // Check for both ESLint and Oxlint
      const hasEslint = detectedTools.configs.some((c) => c.tool === 'eslint');
      const hasOxlint = existsSync(join(projectRoot, 'oxlint.json'));

      if (hasEslint && hasOxlint) {
        issues.push({
          description: 'Both ESLint and Oxlint are configured',
          severity: 'warning',
          fix: 'Consider using only Oxlint for better performance. Run "flint clean" to remove ESLint',
        });
      }

      // Check for old tools alongside new ones
      const oldTools = ['eslint', 'prettier', 'husky'];
      const newTools = ['biome', 'oxlint', 'lefthook'];

      const hasOldTools = detectedTools.configs.some((c) =>
        oldTools.includes(c.tool)
      );
      const hasNewTools = detectedTools.configs.some(
        (c) =>
          newTools.includes(c.tool) ||
          c.path.includes('biome.json') ||
          c.path.includes('oxlint.json')
      );

      if (hasOldTools && hasNewTools) {
        issues.push({
          description: 'Mix of old and new tools detected',
          severity: 'warning',
          fix: 'Run "flint clean" to remove old tools, then "flint init" to complete migration',
        });
      }
    }
    const toolsToCheck: ToolVersion[] = [
      { tool: 'node', version: null, required: '>=18.0.0' },
      { tool: 'npm', version: null, required: '>=8.0.0' },
    ];

    // Check package manager
    const packageManagers = [
      { cmd: 'pnpm --version', tool: 'pnpm', required: '>=8.0.0' },
      { cmd: 'yarn --version', tool: 'yarn', required: '>=1.0.0' },
      { cmd: 'bun --version', tool: 'bun', required: '>=1.0.0' },
    ];

    let detectedPackageManager = null;
    for (const pm of packageManagers) {
      try {
        const version = execSync(pm.cmd, { encoding: 'utf-8' }).trim();
        if (version) {
          detectedPackageManager = pm.tool;
          toolsToCheck.push({ tool: pm.tool, version, required: pm.required });
          break;
        }
      } catch {
        // Package manager not found
      }
    }

    if (!detectedPackageManager) {
      issues.push({
        description:
          'No alternative package manager detected (pnpm, yarn, or bun)',
        severity: 'error',
        fix: 'Install pnpm (recommended): npm install -g pnpm',
      });
    }

    // Check Node.js version
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf-8' })
        .trim()
        .slice(1);
      toolsToCheck[0].version = nodeVersion;

      const [major] = nodeVersion.split('.').map(Number);
      if (major < 18) {
        issues.push({
          description: `Node.js version ${nodeVersion} is below minimum required (18.0.0)`,
          severity: 'error',
          fix: 'Update Node.js to version 18 or higher',
        });
      }
    } catch {
      issues.push({
        description: 'Could not detect Node.js version',
        severity: 'error',
        fix: 'Ensure Node.js is installed and in PATH',
      });
    }

    // Check if Flint tools are installed
    const flintDependencies = ['ultracite', 'oxlint', 'markdownlint-cli2'];

    const installedDeps = {
      ...(packageJson.dependencies || {}),
      ...(packageJson.devDependencies || {}),
    };

    for (const dep of flintDependencies) {
      if (
        !(
          installedDeps[dep] ||
          existsSync(join(projectRoot, 'node_modules', dep))
        )
      ) {
        if (dep === 'ultracite') {
          issues.push({
            description: 'Ultracite (Biome wrapper) is not installed',
            severity: 'info',
            fix: 'Run "flint init" to install and configure Ultracite',
          });
        } else {
          issues.push({
            description: `${dep} is not installed`,
            severity: 'info',
            fix: `Run "flint init" to install and configure ${dep}`,
          });
        }
      }
    }
    const vscodeSettingsPath = join(projectRoot, '.vscode', 'settings.json');

    if (existsSync(vscodeSettingsPath)) {
      try {
        const vscodeSettings = JSON.parse(
          readFileSync(vscodeSettingsPath, 'utf-8')
        );

        // Check for conflicting default formatters
        const defaultFormatter = vscodeSettings['editor.defaultFormatter'];
        if (
          defaultFormatter?.includes('prettier') &&
          existsSync(join(projectRoot, 'biome.json'))
        ) {
          issues.push({
            description:
              'VS Code is configured to use Prettier but Biome is installed',
            severity: 'warning',
            fix: 'Update VS Code settings to use Biome as default formatter for JS/TS files',
          });
        }

        // Check if format on save is enabled
        if (!vscodeSettings['editor.formatOnSave']) {
          issues.push({
            description: 'Format on save is disabled in VS Code',
            severity: 'info',
            fix: 'Enable "editor.formatOnSave" in VS Code settings for automatic formatting',
          });
        }
      } catch {
        issues.push({
          description: 'Could not parse VS Code settings.json',
          severity: 'warning',
          fix: 'Check .vscode/settings.json for syntax errors',
        });
      }
    } else {
      issues.push({
        description: 'No VS Code settings found',
        severity: 'info',
        fix: 'Run "flint init" to generate recommended VS Code settings',
      });
    }
    const recommendedScripts = {
      format: 'Format code files',
      lint: 'Lint code files',
      check: 'Run all checks (format, lint, types)',
    };

    const missingScripts = Object.entries(recommendedScripts)
      .filter(([script]) => !packageJson.scripts?.[script])
      .map(([script, description]) => ({
        script,
        description,
      }));

    if (missingScripts.length > 0) {
      issues.push({
        description: `Missing recommended scripts: ${missingScripts.map((s) => s.script).join(', ')}`,
        severity: 'info',
        fix: 'Run "flint init" to add recommended scripts to package.json',
      });
    }

    // Check for outdated script patterns
    if (packageJson.scripts) {
      const scripts = packageJson.scripts;

      // Check for ESLint in scripts when Oxlint is available
      const hasOxlintInstalled = existsSync(join(projectRoot, 'oxlint.json'));
      if (
        hasOxlintInstalled &&
        Object.values(scripts).some(
          (script: unknown) =>
            typeof script === 'string' && script.includes('eslint')
        )
      ) {
        issues.push({
          description:
            'Scripts still reference ESLint but Oxlint is configured',
          severity: 'warning',
          fix: 'Update scripts to use Oxlint instead of ESLint',
        });
      }

      // Check for Prettier in scripts when Biome is available
      if (
        existsSync(join(projectRoot, 'biome.json')) &&
        Object.values(scripts).some(
          (script: unknown) =>
            typeof script === 'string' &&
            script.includes('prettier') &&
            !script.includes('--write')
        )
      ) {
        issues.push({
          description:
            'Scripts reference Prettier for JS/TS files but Biome is configured',
          severity: 'warning',
          fix: 'Update scripts to use Ultracite/Biome for JS/TS formatting',
        });
      }
    }

    // Check for .gitignore
    if (!existsSync(join(projectRoot, '.gitignore'))) {
      issues.push({
        description: 'No .gitignore file found',
        severity: 'warning',
        fix: 'Create a .gitignore file to exclude node_modules and other generated files',
      });
    }

    // Check for TypeScript
    const hasTypeScript = existsSync(join(projectRoot, 'tsconfig.json'));
    if (hasTypeScript) {
      // Check if strict mode is enabled
      try {
        const tsConfig = JSON.parse(
          readFileSync(join(projectRoot, 'tsconfig.json'), 'utf-8')
        );
        if (!tsConfig.compilerOptions?.strict) {
          issues.push({
            description: 'TypeScript strict mode is not enabled',
            severity: 'info',
            fix: 'Enable "strict": true in tsconfig.json for better type safety',
          });
        }
      } catch {
        issues.push({
          description: 'Could not parse tsconfig.json',
          severity: 'warning',
          fix: 'Check tsconfig.json for syntax errors',
        });
      }
    }

    // Summary
    // Summary counts (potentially used for reporting)
    const errorCount = issues.filter((i) => i.severity === 'error').length;
    const warningCount = issues.filter((i) => i.severity === 'warning').length;
    const infoCount = issues.filter((i) => i.severity === 'info').length;

    // Use the counts to potentially enhance report
    void errorCount;
    void warningCount;
    void infoCount;

    // Sort issues by severity
    issues.sort((a, b) => {
      const severityOrder = { error: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });

    return success({ issues });
  } catch (error) {
    return failure(
      makeError(
        'INTERNAL_ERROR',
        `Doctor failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    );
  }
}
