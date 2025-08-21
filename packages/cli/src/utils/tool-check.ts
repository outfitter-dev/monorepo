import { platform } from 'node:os';
import { failure, type Result, success } from '@outfitter/contracts';
import { $ } from 'bun';

interface ToolVersion {
  name: string;
  version: string;
  path: string;
}

/**

- Check if a command-line tool is available in the system PATH.
- @param tool The name of the tool to check
- @returns Result containing tool information or an error
 */
async function checkTool(tool: string): Promise<Result<ToolVersion, Error>> {
  try {
    // Cross-platform discovery: 'where' on Windows; 'command -v' via sh on POSIX
    const isWindows = platform() === 'win32';
    const path = isWindows
      ? (await $`where ${tool}`.text()).split(/\r?\n/)[0].trim()
      : // 'command' is a shell builtin; invoke through sh -c
        (await $`sh -c ${['command', '-v', tool]}`.text()).trim();

    // Try to get version information
    let version = 'unknown';
    try {
      const stdout = await $`${tool} --version`.timeout(5000).text();
      // Extract version number from output (handles common formats)
      const versionMatch = stdout.match(/\bv?(\d+\.\d+\.\d+(?:[-+][\w.-]+)?)/);
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

- Check that all required tools are available.
- @returns Result with void on success or an error describing missing tools
 */
export async function checkRequiredTools(): Promise<Result<void, Error>> {
  const requiredTools = ['git', 'node'];
  const results = await Promise.all(
    requiredTools.map((tool) => checkTool(tool))
  );

  const missing = results
    .filter((result: Result<ToolVersion, Error>) => !result.success)
    .map(
      (_: Result<ToolVersion, Error>, index: number) => requiredTools[index]
    );

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

- Check for optional tools and return their availability.
- @returns Map of tool names to their availability
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

- Get detailed information about the Node.js environment.
- @returns Result containing Node.js version info or an error
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
    const npmVersion = await $`npm --version`.timeout(5000).text();

    return success({
      ...nodeResult.data,
      npm: npmVersion.trim(),
    });
  } catch {
    return failure(new Error('Failed to get npm version'));
  }
}
