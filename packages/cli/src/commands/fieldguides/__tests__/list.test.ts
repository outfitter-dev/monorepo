import { listFieldguides } from '../list.js';
import { readJSON, pathExists } from 'fs-extra';

jest.mock('fs-extra', () => ({
  readJSON: jest.fn(),
  pathExists: jest.fn(),
}));

jest.mock('chalk', () => ({
  cyan: (s: string) => s,
  green: (s: string) => s,
  yellow: (s: string) => s,
  gray: (s: string) => s,
}));

describe('listFieldguides', () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    jest.resetAllMocks();
  });

  it('should list all fieldguides when no flags provided', async () => {
    // Arrange
    (pathExists as jest.Mock).mockResolvedValue(true);
    (readJSON as jest.Mock).mockResolvedValue({
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
    (pathExists as jest.Mock).mockResolvedValue(true);
    (readJSON as jest.Mock).mockResolvedValue({
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
    (pathExists as jest.Mock).mockResolvedValue(false);

    // Act
    await listFieldguides({});

    // Assert
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('No fieldguides installed yet')
    );
  });

  it('should warn when installed list is empty and installed flag is true', async () => {
    // Arrange
    (pathExists as jest.Mock).mockResolvedValue(true);
    (readJSON as jest.Mock).mockResolvedValue({ fieldguides: [] });

    // Act
    await listFieldguides({ installed: true });

    // Assert
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('No fieldguides installed yet')
    );
  });

  it('should support legacy supplies key', async () => {
    // Arrange
    (pathExists as jest.Mock).mockResolvedValue(true);
    (readJSON as jest.Mock).mockResolvedValue({ supplies: ['react-patterns'] });

    // Act
    await listFieldguides({ installed: true });

    // Assert
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('react-patterns')
    );
  });

  it('should filter out duplicate fieldguides', async () => {
    // Arrange
    (pathExists as jest.Mock).mockResolvedValue(true);
    (readJSON as jest.Mock).mockResolvedValue({
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
