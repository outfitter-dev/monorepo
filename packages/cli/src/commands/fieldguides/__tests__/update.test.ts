import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import fs from 'fs/promises';
import fetch from 'node-fetch';
import consola from 'consola';
import ora from 'ora';
import { update } from '../update.js';

vi.mock('fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  access: vi.fn(),
}));
vi.mock('node-fetch', () => ({
  default: vi.fn(),
}));
vi.mock('consola', () => ({
  default: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock('ora', () => ({
  default: vi.fn(() => ({
    start: vi.fn(),
    stop: vi.fn(),
    fail: vi.fn(),
  })),
}));

const exitMock = vi.spyOn(process, 'exit').mockImplementation(() => undefined);

describe('update command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('updates field guides manifest and writes files successfully', async () => {
    const mockManifest = JSON.stringify(['guide1.md', 'guide2.md']);

    (fs.readFile as unknown as vi.Mock).mockResolvedValue(mockManifest);
    (fs.access as unknown as vi.Mock).mockRejectedValue({ code: 'ENOENT' });
    (fetch as unknown as vi.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('guide content'),
    });
    (fs.writeFile as unknown as vi.Mock).mockResolvedValue(undefined);

    await update({ manifest: 'manifest.json', output: 'outDir', force: true });

    expect(fs.readFile).toHaveBeenCalledWith('manifest.json', 'utf-8');
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('outDir/guide1.md'),
      'guide content'
    );
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('outDir/guide2.md'),
      'guide content'
    );
    expect(consola.success).toHaveBeenCalledWith(
      'Field guides updated successfully'
    );
    expect(exitMock).not.toHaveBeenCalled();
  });

  it('throws when mandatory flag --manifest is missing', async () => {
    // @ts-expect-error missing manifest
    await expect(update({ output: 'outDir', force: false })).rejects.toThrow(
      /missing.*--manifest/i
    );
    expect(fs.readFile).not.toHaveBeenCalled();
  });

  it('skips download when manifest array is empty', async () => {
    (fs.readFile as unknown as vi.Mock).mockResolvedValue(JSON.stringify([]));

    await update({ manifest: 'manifest.json', output: 'outDir', force: false });

    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(consola.info).toHaveBeenCalledWith('No field guides to update');
  });

  it('aborts overwrite when file exists and --force not set', async () => {
    (fs.readFile as unknown as vi.Mock)
      .mockResolvedValue(JSON.stringify(['guide.md']))(
        fs.access as unknown as vi.Mock
      )
      .mockResolvedValue(undefined);

    await update({ manifest: 'manifest.json', output: 'outDir', force: false });

    expect(fs.writeFile).not.toHaveBeenCalled();
    expect(consola.error).toHaveBeenCalledWith(
      expect.stringContaining('already exists')
    );
    expect(exitMock).toHaveBeenCalledWith(1);
  });

  it('handles fetch failure', async () => {
    (fs.readFile as unknown as vi.Mock)
      .mockResolvedValue(JSON.stringify(['guide.md']))(
        fs.access as unknown as vi.Mock
      )
      .mockRejectedValue({ code: 'ENOENT' })(fetch as unknown as vi.Mock)
      .mockRejectedValue(new Error('Network error'));

    await update({ manifest: 'manifest.json', output: 'outDir', force: true });

    expect(consola.error).toHaveBeenCalledWith(
      expect.stringContaining('Network error')
    );
    expect(exitMock).toHaveBeenCalledWith(1);
  });

  it('handles writeFile failure with ENOSPC', async () => {
    (fs.readFile as unknown as vi.Mock)
      .mockResolvedValue(JSON.stringify(['guide.md']))(
        fs.access as unknown as vi.Mock
      )
      .mockRejectedValue({ code: 'ENOENT' })(fetch as unknown as vi.Mock)
      .mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('content'),
      })(fs.writeFile as unknown as vi.Mock)
      .mockRejectedValue({ code: 'ENOSPC' });

    await update({ manifest: 'manifest.json', output: 'outDir', force: true });

    expect(consola.error).toHaveBeenCalledWith(
      expect.stringContaining('ENOSPC')
    );
    expect(exitMock).toHaveBeenCalledWith(1);
  });

  it('throws on invalid JSON in manifest', async () => {
    (fs.readFile as unknown as vi.Mock).mockResolvedValue('invalid json');

    await expect(
      update({ manifest: 'manifest.json', output: 'outDir', force: false })
    ).rejects.toThrow(SyntaxError);
    expect(consola.error).not.toHaveBeenCalled();
  });
});
