import { ILLMAdapter, GenerateInput, GenerateOutput } from '@aegis-monitor/core';

/**
 * Base class with common adapter functionality
 */
export abstract class BaseAdapter implements ILLMAdapter {
  protected maxRetries = 3;
  protected retryDelayMs = 1000;

  abstract generate(input: GenerateInput): Promise<GenerateOutput>;

  /**
   * Exponential backoff retry logic
   */
  protected async withRetry<T>(fn: () => Promise<T>, retries = this.maxRetries): Promise<T> {
    let lastError: Error | undefined;

    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < retries - 1) {
          const delayMs = this.retryDelayMs * Math.pow(2, i);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw lastError;
  }

  /**
   * Measure latency of a function
   */
  protected async measureLatency<T>(fn: () => Promise<T>): Promise<[T, number]> {
    const start = Date.now();
    const result = await fn();
    const latencyMs = Date.now() - start;
    return [result, latencyMs];
  }
}

/**
 * Adapter configuration base
 */
export interface AdapterConfig {
  apiKey: string;
  model: string;
}
