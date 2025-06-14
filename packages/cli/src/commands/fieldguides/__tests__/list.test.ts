import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { listFieldguides } from '../list';
import fsExtra from 'fs-extra';
const { readJSON, pathExists } = fsExtra;

vi.mock('fs-extra', () => ({
  default: {
    readJSON: vi.fn(),
    pathExists: vi.fn(),
  },
  readJSON: vi.fn(),
  pathExists: vi.fn(),
}));

vi.mock('chalk', () => ({
  default: {
    cyan: (s: string) => s,
    green: (s: string) => s,
    yellow: (s: string) => s,
    gray: (s: string) => s,
  },
}));

describe('listFieldguides', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    vi.resetAllMocks();
  });

  it('should list all fieldguides when no flags provided', async () => {
    // Arrange
    vi.mocked(pathExists).mockResolvedValue(true);
    vi.mocked(readJSON).mockResolvedValue({
      fieldguides: ['typescript-standards'],
    });

    // Act
    await listFieldguides({});

    // Assert
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('typescript-standards')
    );
  });

  it('should list only installed fieldguides when installed flag is true', async () => {
    // Arrange
    vi.mocked(pathExists).mockResolvedValue(true);
    vi.mocked(readJSON).mockResolvedValue({
      fieldguides: ['typescript-standards', 'react-patterns'],
    });

    // Act
    await listFieldguides({ installed: true });

    // Assert
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('typescript-standards')
    );
    expect(logSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('react-patterns')
    );
  });

  it('should log message when no config file present', async () => {
    // Arrange
    vi.mocked(pathExists).mockResolvedValue(false);

    // Act
    await listFieldguides({});

    // Assert
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('No fieldguides installed yet')
    );
  });

  it('should warn when installed list is empty and installed flag is true', async () => {
    // Arrange
    vi.mocked(pathExists).mockResolvedValue(true);
    vi.mocked(readJSON).mockResolvedValue({ fieldguides: [] });

    // Act
    await listFieldguides({ installed: true });

    // Assert
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('No fieldguides installed yet')
    );
  });

  it('should support legacy supplies key', async () => {
    // Arrange
    vi.mocked(pathExists).mockResolvedValue(true);
    vi.mocked(readJSON).mockResolvedValue({ supplies: ['react-patterns'] });

    // Act
    await listFieldguides({ installed: true });

    // Assert
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('react-patterns')
    );
  });

  it('should filter out duplicate fieldguides', async () => {
    // Arrange
    vi.mocked(pathExists).mockResolvedValue(true);
    vi.mocked(readJSON).mockResolvedValue({
      fieldguides: ['dup-guide', 'unique-guide', 'dup-guide'],
    });

    // Act
    await listFieldguides({});

    // Assert
    const loggedMessages = logSpy.mock.calls
      .flat()
      .filter(arg => typeof arg === 'string') as string[];
    const dupOccurrences = loggedMessages.filter(msg =>
      msg.includes('dup-guide')
    ).length;
    expect(dupOccurrences).toBe(1);
    expect(loggedMessages).toEqual(
      expect.arrayContaining([expect.stringContaining('unique-guide')])
    );
  });
});
