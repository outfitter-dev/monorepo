import { execSync } from 'child_process';
import {
  existsSync,
  mkdirSync,
  copyFileSync,
  chmodSync,
  readFileSync,
  writeFileSync,
} from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface PackageJson {
  scripts?: Record<string, string>;
  [key: string]: unknown;
}

export interface HuskyInitOptions {
  cwd?: string;
  hooks?: Array<'pre-commit' | 'commit-msg'>;
}

export function initHusky(options: HuskyInitOptions = {}): void {
  const { cwd = process.cwd(), hooks = ['pre-commit', 'commit-msg'] } = options;

  try {
    // Initialize husky
    execSync('npx husky init', { cwd, stdio: 'inherit' });

    // Create .husky directory if it doesn't exist
    const huskyDir = join(cwd, '.husky');
    if (!existsSync(huskyDir)) {
      mkdirSync(huskyDir, { recursive: true });
    }

    // Copy selected hooks
    const hooksDir = join(dirname(__dirname), 'hooks');

    for (const hook of hooks) {
      const sourcePath = join(hooksDir, hook);
      const targetPath = join(huskyDir, hook);

      if (existsSync(sourcePath)) {
        copyFileSync(sourcePath, targetPath);
        chmodSync(targetPath, 0o755);
        console.log(`✓ Installed ${hook} hook`);
      }
    }

    console.log('✓ Husky initialized successfully');
  } catch (error) {
    console.error('Failed to initialize husky:', error);
    throw error;
  }
}

export function addPrepareScript(packageJsonPath?: string): void {
  const pkgPath = packageJsonPath ?? join(process.cwd(), 'package.json');

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as PackageJson;

    pkg.scripts ??= {};

    if (!pkg.scripts.prepare) {
      pkg.scripts.prepare = 'husky';
      writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      console.log('✓ Added prepare script to package.json');
    } else {
      console.log('ℹ Prepare script already exists');
    }
  } catch (error) {
    console.error('Failed to add prepare script:', error);
    throw error;
  }
}
