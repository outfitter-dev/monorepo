import { platform } from 'node:os';
import { failure, type Result, success } from '@outfitter/contracts';
import { execa } from 'execa';
import semver from 'semver';

export interface EnvironmentInfo {
  node: {
    version: string;
    minimum: string;
    isValid: boolean;
  };
  npm: {
    version: string;
    minimum: string;
    isValid: boolean;
  };
  git: {
    version: string;
    minimum: string;
    isValid: boolean;
  };
  packageManager: {
    name: string;
    version: string;
    path: string;
  } | null;
  platform: NodeJS.Platform;
  arch: string;
}

const MINIMUM_VERSIONS = {
  node: '18.0.0',
  npm: '8.0.0',
  git: '2.0.0',
};

/**
 * Extract version from command output.
 * Handles common version string formats.
 */
function extractVersion(output: string): string | null {
  // Try to match semantic version pattern
  const match = output.match(/(\d+\.\d+\.\d+)/);
  return match ? match[1] : null;
}

/**
 * Get Git version information.
 */
async function getGitVersion(): Promise<Result<string, Error>> {
  try {
    const { stdout } = await execa('git', ['--version'], { timeout: 5000 });
    const version = extractVersion(stdout);
    if (!version) {
      return failure(new Error('Could not parse Git version'));
    }
    return success(version);
  } catch {
    return failure(new Error('Git is not installed or not in PATH'));
  }
}

/**
 * Detect the primary package manager in use.
 */
async function detectPackageManager(): Promise<
  EnvironmentInfo['packageManager']
> {
  // Check for package manager executables
  const managers = ['pnpm', 'yarn', 'bun'];

  for (const manager of managers) {
    try {
      const { stdout: pathOutput } = await execa('which', [manager]);
      const { stdout: versionOutput } = await execa(manager, ['--version'], {
        timeout: 5000,
      });
      const version = extractVersion(versionOutput);

      if (version) {
        return {
          name: manager,
          version,
          path: pathOutput.trim(),
        };
      }
    } catch {
      // Continue to next manager
    }
  }

  // Default to npm (always available with Node.js)
  return null;
}

/**
 * Validate the current environment meets minimum requirements.
 * @returns Result containing environment information or validation errors
 */
export async function validateEnvironment(): Promise<
  Result<EnvironmentInfo, Error>
> {
  const errors: string[] = [];

  // Check Node.js version
  const nodeVersion = process.version.substring(1); // Remove 'v' prefix
  const nodeValid = semver.gte(nodeVersion, MINIMUM_VERSIONS.node);
  if (!nodeValid) {
    errors.push(
      `Node.js ${nodeVersion} is below minimum required version ${MINIMUM_VERSIONS.node}`
    );
  }

  // Check npm version
  let npmVersion = '0.0.0';
  let npmValid = false;
  try {
    const { stdout } = await execa('npm', ['--version'], { timeout: 5000 });
    npmVersion = stdout.trim();
    npmValid = semver.gte(npmVersion, MINIMUM_VERSIONS.npm);
    if (!npmValid) {
      errors.push(
        `npm ${npmVersion} is below minimum required version ${MINIMUM_VERSIONS.npm}`
      );
    }
  } catch {
    errors.push('npm is not available');
  }

  // Check Git version
  const gitResult = await getGitVersion();
  let gitVersion = '0.0.0';
  let gitValid = false;

  if (gitResult.success) {
    gitVersion = gitResult.data;
    gitValid = semver.gte(gitVersion, MINIMUM_VERSIONS.git);
    if (!gitValid) {
      errors.push(
        `Git ${gitVersion} is below minimum required version ${MINIMUM_VERSIONS.git}`
      );
    }
  } else {
    errors.push(gitResult.error.message);
  }

  // If there are critical errors, return early
  if (errors.length > 0) {
    return failure(
      new Error(`Environment validation failed:\n${errors.join('\n')}`)
    );
  }

  // Detect package manager (non-critical)
  const packageManager = await detectPackageManager();

  const envInfo: EnvironmentInfo = {
    node: {
      version: nodeVersion,
      minimum: MINIMUM_VERSIONS.node,
      isValid: nodeValid,
    },
    npm: {
      version: npmVersion,
      minimum: MINIMUM_VERSIONS.npm,
      isValid: npmValid,
    },
    git: {
      version: gitVersion,
      minimum: MINIMUM_VERSIONS.git,
      isValid: gitValid,
    },
    packageManager,
    platform: platform() as NodeJS.Platform,
    arch: process.arch,
  };

  return success(envInfo);
}

/**
 * Format environment information for display.
 */
export function formatEnvironmentInfo(info: EnvironmentInfo): string {
  const lines = [
    '🔍 Environment Check:',
    '',
    `Node.js: ${info.node.version} ${info.node.isValid ? '✅' : '❌'} (minimum: ${info.node.minimum})`,
    `npm: ${info.npm.version} ${info.npm.isValid ? '✅' : '❌'} (minimum: ${info.npm.minimum})`,
    `Git: ${info.git.version} ${info.git.isValid ? '✅' : '❌'} (minimum: ${info.git.minimum})`,
  ];

  if (info.packageManager) {
    lines.push(
      `Package Manager: ${info.packageManager.name} v${info.packageManager.version} ✅`
    );
  }

  lines.push('', `Platform: ${info.platform} (${info.arch})`);

  return lines.join('\n');
}
