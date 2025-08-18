/**

- File system operations with Result pattern
 */

import *as fs from 'node:fs/promises';
import* as path from 'node:path';
import { failure, isSuccess, type Result, success } from '@outfitter/contracts';
import { glob } from 'glob';

export interface FileSystemError {
  type: 'FILE_SYSTEM_ERROR';
  code: string;
  message: string;
  path?: string | undefined;
}

function makeFileSystemError(
  code: string,
  message: string,
  filePath?: string | undefined
): FileSystemError {
  return {
    type: 'FILE_SYSTEM_ERROR',
    code,
    message,
    ...(filePath !== undefined && { path: filePath }),
  };
}

/**

- Check if a file exists
 */
export async function fileExists(
  filePath: string
): Promise<Result<boolean, FileSystemError>> {
  try {
    await fs.access(filePath);
    return success(true);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return success(false);
    }
    return failure(
      makeFileSystemError('ACCESS_ERROR', `Failed to check file: ${error}`)
    );
  }
}

/**

- Read a text file
 */
export async function readFile(
  filePath: string
): Promise<Result<string, FileSystemError>> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return success(content);
  } catch (error) {
    return failure(
      makeFileSystemError(
        'READ_ERROR',
        `Failed to read file: ${error}`,
        filePath
      )
    );
  }
}

/**

- Write a text file
 */
export async function writeFile(
  filePath: string,
  content: string
): Promise<Result<void, FileSystemError>> {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return success(undefined);
  } catch (error) {
    return failure(
      makeFileSystemError(
        'WRITE_ERROR',
        `Failed to write file: ${error}`,
        filePath
      )
    );
  }
}

/**

- Read and parse JSON file
 */
export async function readJSON<T = unknown>(
  filePath: string
): Promise<Result<T, FileSystemError>> {
  const contentResult = await readFile(filePath);
  if (!isSuccess(contentResult)) {
    return contentResult;
  }

  try {
    const data = JSON.parse(contentResult.data) as T;
    return success(data);
  } catch (error) {
    return failure(
      makeFileSystemError(
        'PARSE_ERROR',
        `Failed to parse JSON: ${error}`,
        filePath
      )
    );
  }
}

/**

- Write JSON file
 */
export async function writeJSON(
  filePath: string,
  data: unknown
): Promise<Result<void, FileSystemError>> {
  try {
    const content = JSON.stringify(data, null, 2);
    return writeFile(filePath, content);
  } catch (error) {
    return failure(
      makeFileSystemError(
        'STRINGIFY_ERROR',
        `Failed to stringify JSON: ${error}`,
        filePath
      )
    );
  }
}

/**

- Ensure directory exists
 */
export async function ensureDir(
  dirPath: string
): Promise<Result<void, FileSystemError>> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return success(undefined);
  } catch (error) {
    return failure(
      makeFileSystemError(
        'MKDIR_ERROR',
        `Failed to create directory: ${error}`,
        dirPath
      )
    );
  }
}

/**

- Remove file or directory
 */
export async function remove(
  targetPath: string
): Promise<Result<void, FileSystemError>> {
  try {
    await fs.rm(targetPath, { recursive: true, force: true });
    return success(undefined);
  } catch (error) {
    return failure(
      makeFileSystemError(
        'REMOVE_ERROR',
        `Failed to remove: ${error}`,
        targetPath
      )
    );
  }
}

/**

- Copy file
 */
export async function copyFile(
  src: string,
  dest: string
): Promise<Result<void, FileSystemError>> {
  try {
    await fs.copyFile(src, dest);
    return success(undefined);
  } catch (error) {
    return failure(
      makeFileSystemError('COPY_ERROR', `Failed to copy file: ${error}`, src)
    );
  }
}

/**

- Move/rename file
 */
export async function moveFile(
  src: string,
  dest: string
): Promise<Result<void, FileSystemError>> {
  try {
    await fs.rename(src, dest);
    return success(undefined);
  } catch (error) {
    return failure(
      makeFileSystemError('MOVE_ERROR', `Failed to move file: ${error}`, src)
    );
  }
}

/**

- List files in directory
 */
export async function listFiles(
  dirPath: string
): Promise<Result<string[], FileSystemError>> {
  try {
    const files = await fs.readdir(dirPath);
    return success(files);
  } catch (error) {
    return failure(
      makeFileSystemError(
        'LIST_ERROR',
        `Failed to list files: ${error}`,
        dirPath
      )
    );
  }
}

/**

- Get file stats
 */
export async function getStats(
  filePath: string
): Promise<Result<Awaited<ReturnType<typeof fs.stat>>, FileSystemError>> {
  try {
    const stats = await fs.stat(filePath);
    return success(stats);
  } catch (error) {
    return failure(
      makeFileSystemError(
        'STAT_ERROR',
        `Failed to get stats: ${error}`,
        filePath
      )
    );
  }
}

/**

- Find files matching glob pattern
 */
export async function findFiles(
  pattern: string,
  options?: import('glob').GlobOptions
): Promise<Result<string[], FileSystemError>> {
  try {
    const files = await glob(pattern, options ?? {});
    // Ensure we return string[] - convert Path objects to strings if needed
    const stringFiles = files.map((file) =>
      typeof file === 'string' ? file : file.toString()
    );
    return success(stringFiles);
  } catch (error) {
    return failure(
      makeFileSystemError('GLOB_ERROR', `Failed to glob files: ${error}`)
    );
  }
}

/**

- Read package.json from current directory
 */
export async function readPackageJson(): Promise<
  Result<Record<string, unknown>, FileSystemError>

> {
  return readJSON('package.json');
}

/**

- Write package.json to current directory
 */
export async function writePackageJson(
  data: Record<string, unknown>
): Promise<Result<void, FileSystemError>> {
  return writeJSON('package.json', data);
}

/**

- Create a backup of file content
 */
export async function backupFile(
  filePath: string,
  backupDir = '.flint-backup'
): Promise<Result<string, FileSystemError>> {
  const existsResult = await fileExists(filePath);
  if (!isSuccess(existsResult)) {
    return failure(existsResult.error);
  }

  if (!existsResult.data) {
    return failure(
      makeFileSystemError('NOT_FOUND', 'File does not exist', filePath)
    );
  }

  const contentResult = await readFile(filePath);
  if (!isSuccess(contentResult)) {
    return contentResult;
  }

  const ensureDirResult = await ensureDir(backupDir);
  if (!isSuccess(ensureDirResult)) {
    return failure(ensureDirResult.error);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const basename = path.basename(filePath);
  const backupPath = path.join(backupDir, `${basename}.${timestamp}.backup`);

  const writeResult = await writeFile(backupPath, contentResult.data);
  if (!isSuccess(writeResult)) {
    return failure(writeResult.error);
  }

  return success(backupPath);
}
