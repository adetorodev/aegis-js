import { describe, expect, it } from 'vitest';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  initCommand,
  runCommand,
  compareCommand,
  baselineSaveCommand,
  loadCLIConfig,
  createScorers,
  type CLIConfig,
} from '../src/index.js';

describe('CLI config and commands', () => {
  it('loads config from JSON', async () => {
    const dir = join(tmpdir(), `aegis-cli-${Date.now()}`);
    await mkdir(dir, { recursive: true });

    const configPath = join(dir, 'aegis.config.json');
    const config: CLIConfig = {
      datasetPath: './dataset.json',
      adapter: { provider: 'mock', model: 'gpt-4', mockResponse: 'hello' },
      scorers: ['exact'],
      concurrency: 2,
      thresholds: {
        cost: { warnAbove: 1, failAbove: 2 },
      },
      output: { format: 'json' },
    };

    await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');

    const loaded = await loadCLIConfig(configPath, dir);
    expect(loaded.adapter.provider).toBe('mock');
    expect(loaded.scorers).toEqual(['exact']);

    await rm(dir, { recursive: true, force: true });
  });

  it('init command creates .aegis and aegis.config.ts', async () => {
    const dir = join(tmpdir(), `aegis-cli-${Date.now()}`);
    await mkdir(dir, { recursive: true });

    const out: string[] = [];
    const code = await initCommand(
      { cwd: dir },
      {
        cwd: dir,
        stdout: (msg) => out.push(msg),
        stderr: () => undefined,
      }
    );

    expect(code).toBe(0);
    expect(out.some((line) => line.includes('Initialized Aegis Monitor project.'))).toBe(true);

    await rm(dir, { recursive: true, force: true });
  });

  it('createScorers throws for unsupported scorer', () => {
    const config: CLIConfig = {
      datasetPath: './dataset.json',
      adapter: { provider: 'mock', model: 'gpt-4' },
      scorers: ['unknown-scorer'],
    };

    expect(() => createScorers(config)).toThrow('Unsupported scorer');
  });

  it('run command returns error code when config missing', async () => {
    const dir = join(tmpdir(), `aegis-cli-${Date.now()}`);
    await mkdir(dir, { recursive: true });

    const errors: string[] = [];
    const code = await runCommand(
      { config: 'missing.config.ts', cwd: dir },
      {
        cwd: dir,
        stdout: () => undefined,
        stderr: (msg) => errors.push(msg),
      }
    );

    expect(code).toBe(2);
    expect(errors.some((line) => line.includes('Run failed'))).toBe(true);

    await rm(dir, { recursive: true, force: true });
  });

  it('baseline save and compare succeed with mock adapter config', async () => {
    const dir = join(tmpdir(), `aegis-cli-${Date.now()}`);
    await mkdir(dir, { recursive: true });

    const datasetPath = join(dir, 'dataset.json');
    const configPath = join(dir, 'aegis.config.json');

    await writeFile(
      datasetPath,
      JSON.stringify(
        {
          cases: [{ input: 'hello', expectedOutput: 'hello' }],
        },
        null,
        2
      ),
      'utf-8'
    );

    const config: CLIConfig = {
      datasetPath,
      adapter: { provider: 'mock', model: 'gpt-4', mockResponse: 'hello' },
      scorers: ['exact'],
      concurrency: 1,
      output: { format: 'json' },
      thresholds: {
        regression: {
          score: { absoluteDrop: 1 },
          cost: { absoluteDrop: 100 },
          latency: { absoluteDrop: 10000 },
        },
      },
    };

    await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');

    const saveCode = await baselineSaveCommand(
      { config: configPath, cwd: dir },
      {
        cwd: dir,
        stdout: () => undefined,
        stderr: () => undefined,
      }
    );

    expect(saveCode).toBe(0);

    const compareOutput: string[] = [];
    const compareCode = await compareCommand(
      { config: configPath, cwd: dir, json: true },
      {
        cwd: dir,
        stdout: (msg) => compareOutput.push(msg),
        stderr: () => undefined,
      }
    );

    expect(compareCode).toBe(0);
    expect(compareOutput.length).toBeGreaterThan(0);

    await rm(dir, { recursive: true, force: true });
  });
}
);
