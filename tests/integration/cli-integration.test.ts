import { describe, it, expect } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runCommand, compareCommand, baselineSaveCommand, type CLIConfig } from '@aegis-monitor/cli';

describe('Integration: CLI workflow', () => {
  it('runs baseline save -> compare -> run across packages', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'aegis-cli-it-'));

    const datasetPath = join(dir, 'dataset.json');
    const configPath = join(dir, 'aegis.config.json');

    await writeFile(
      datasetPath,
      JSON.stringify({
        cases: [
          { input: 'hello', expectedOutput: 'hello' },
          { input: 'world', expectedOutput: 'world' },
        ],
      }),
      'utf-8'
    );

    const config: CLIConfig = {
      datasetPath,
      adapter: {
        provider: 'mock',
        model: 'gpt-4',
        mockResponse: 'hello',
      },
      scorers: ['exact'],
      concurrency: 2,
      thresholds: {
        cost: {
          warnAbove: 100,
          failAbove: 200,
        },
        regression: {
          score: { percentageDrop: 100 },
          cost: { percentageDrop: 1000 },
          latency: { percentageDrop: 1000 },
        },
      },
      output: { format: 'json' },
    };

    await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');

    const saveCode = await baselineSaveCommand({ config: configPath, cwd: dir });
    expect(saveCode).toBe(0);

    const compareCode = await compareCommand({ config: configPath, cwd: dir, json: true });
    expect(compareCode).toBe(0);

    const runCode = await runCommand({ config: configPath, cwd: dir, json: true });
    expect(runCode).toBe(0);

    await rm(dir, { recursive: true, force: true });
  });
});
