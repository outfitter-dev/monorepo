import { failure, type Result, success } from '@outfitter/contracts';
import { execa } from 'execa';

interface ToolVersion {
  name: string;
  version: string;
  path: string;
}

/**
 * Check if a command-line tool is available in the system PATH.
 * @param tool The name of the tool to check
 * @returns Result containing tool information or an error
 */
async function checkTool(tool: string): Promise<Result<ToolVersion, Error>> {
  try {
    // Use 'which' to find the tool's path
    const { stdout: path } = await execa('which', [tool]);

    // Try to get version information
    let version = 'unknown';
    try {
      const { stdout } = await execa(tool, ['--version'], { timeout: 5000 });
      // Extract version number from output (handles common formats)
      const versionMatch = stdout.match(/(\d+\.\d+\.\d+)/);
      if (versionMatch) {
        version = versionMatch[1];
      }
    } catch {
      // Some tools might not have --version flag
    }

    return success({ name: tool, version, path });
  } catch {
    return failure(new Error(`Tool '${tool}' not found in PATH`));
  }
}

/**
 * Check that all required tools are available.
 * @returns Result with void on success or an error describing missing tools
 */
export async function checkRequiredTools(): Promise<Result<void, Error>> {
  const requiredTools = ['git', 'node'];
  const results = await Promise.all(
    requiredTools.map((tool) => checkTool(tool))
  );

  const missing = results
    .filter((result) => !result.success)
    .map((_, index: number) => requiredTools[index]);

  if (missing.length > 0) {
    return failure(
      new Error(
        `Required tools not found: ${missing.join(', ')}. Please install them and try again.`
      )
    );
  }

  return success(undefined);
}

/**
 * Check for optional tools and return their availability.
 * @returns Map of tool names to their availability
 */
export async function checkOptionalTools(): Promise<Map<string, boolean>> {
  const optionalTools = ['pnpm', 'yarn', 'bun'];
  const results = new Map<string, boolean>();

  for (const tool of optionalTools) {
    const result = await checkTool(tool);
    results.set(tool, result.success);
  }

  return results;
}

/**
 * Get detailed information about the Node.js environment.
 * @returns Result containing Node.js version info or an error
 */
export async function getNodeInfo(): Promise<
  Result<ToolVersion & { npm: string }, Error>
> {
  const nodeResult = await checkTool('node');
  if (!nodeResult.success) {
    return failure(nodeResult.error);
  }

  try {
    // Get npm version as well
    const { stdout: npmVersion } = await execa('npm', ['--version'], {
      timeout: 5000,
    });

    return success({
      ...nodeResult.data,
      npm: npmVersion.trim(),
    });
  } catch {
    return failure(new Error('Failed to get npm version'));
  }
}
