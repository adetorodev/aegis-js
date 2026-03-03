import { readFile } from 'node:fs/promises';
import type { Dataset } from './index.js';
import { validateDataset } from './utils.js';

/**
 * Loader and validator for evaluation datasets.
 */
export class DatasetLoader {
  /**
   * Load dataset from a JSON file.
   */
  async loadFromFile(filePath: string): Promise<Dataset> {
    const raw = await readFile(filePath, 'utf-8');
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Invalid JSON dataset file: ${message}`);
    }

    return this.loadFromObject(parsed);
  }

  /**
   * Load dataset from an in-memory object.
   */
  loadFromObject(data: unknown): Dataset {
    if (!validateDataset(data)) {
      throw new Error('Invalid dataset format. Expected { cases: EvaluationCase[] }');
    }

    return data as Dataset;
  }

  /**
   * Validate dataset shape.
   */
  validate(data: unknown): data is Dataset {
    return validateDataset(data);
  }
}
