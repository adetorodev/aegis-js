import { describe, it, expect } from 'vitest';
import { writeFile, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { DatasetLoader } from '../src/dataset.js';

describe('DatasetLoader', () => {
  const loader = new DatasetLoader();

  it('loads dataset from object', () => {
    const dataset = loader.loadFromObject({
      cases: [{ input: 'hi', expectedOutput: 'hello' }],
    });

    expect(dataset.cases).toHaveLength(1);
    expect(dataset.cases[0].input).toBe('hi');
  });

  it('throws for invalid object', () => {
    expect(() => loader.loadFromObject({ invalid: true })).toThrow('Invalid dataset format');
  });

  it('validates dataset shape', () => {
    expect(loader.validate({ cases: [{ input: 'a', expectedOutput: 'b' }] })).toBe(true);
    expect(loader.validate({ cases: [{ input: 1, expectedOutput: 'b' }] })).toBe(false);
  });

  it('loads dataset from file', async () => {
    const dir = join(tmpdir(), `aegis-core-dataset-${Date.now()}`);
    const file = join(dir, 'dataset.json');

    await mkdir(dir, { recursive: true });
    await writeFile(
      file,
      JSON.stringify({
        cases: [{ input: 'prompt', expectedOutput: 'output' }],
      }),
      'utf-8'
    );

    const dataset = await loader.loadFromFile(file);
    expect(dataset.cases).toHaveLength(1);
    expect(dataset.cases[0].expectedOutput).toBe('output');

    await rm(dir, { recursive: true, force: true });
  });

  it('throws for invalid JSON file', async () => {
    const dir = join(tmpdir(), `aegis-core-dataset-${Date.now()}`);
    const file = join(dir, 'bad.json');

    await mkdir(dir, { recursive: true });
    await writeFile(file, '{ bad json', 'utf-8');

    await expect(loader.loadFromFile(file)).rejects.toThrow('Invalid JSON dataset file');

    await rm(dir, { recursive: true, force: true });
  });
});
