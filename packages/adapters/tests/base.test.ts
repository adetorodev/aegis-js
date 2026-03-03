import { describe, it, expect, vi } from 'vitest';
import { BaseAdapter } from '../src/base.js';
import { GenerateInput, GenerateOutput } from '@aegis-monitor/core';

/**
 * Test implementatoin of BaseAdapter
 */
class TestAdapter extends BaseAdapter {
  constructor(private responseGenerator: (input: GenerateInput) => Promise<GenerateOutput>) {
    super();
  }

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    return this.responseGenerator(input);
  }
}

describe('BaseAdapter', () => {
  describe('withRetry', () => {
    it('succeeds on first try', async () => {
      const adapter = new TestAdapter(async () => ({
        text: 'success',
        inputTokens: 1,
        outputTokens: 1,
        latencyMs: 10,
      }));

      const spy = vi.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (adapter as any).withRetry(async () => {
        spy();
        return 'result';
      });

      expect(result).toBe('result');
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('retries on failure', async () => {
      let attempts = 0;
      const adapter = new TestAdapter(async () => ({
        text: 'success',
        inputTokens: 1,
        outputTokens: 1,
        latencyMs: 10,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (adapter as any).withRetry(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('throws after max retries', async () => {
      const adapter = new TestAdapter(async () => ({
        text: 'success',
        inputTokens: 1,
        outputTokens: 1,
        latencyMs: 10,
      }));

      await expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (adapter as any).withRetry(async () => {
          throw new Error('Always fails');
        }, 2)
      ).rejects.toThrow('Always fails');
    });
  });

  describe('measureLatency', () => {
    it('measures function execution time', async () => {
      const adapter = new TestAdapter(async () => ({
        text: 'success',
        inputTokens: 1,
        outputTokens: 1,
        latencyMs: 10,
      }));

      const [result, latencyMs] =
        await // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (adapter as any).measureLatency(async () => {
          await new Promise((resolve) => setTimeout(resolve, 50));
          return 'result';
        });

      expect(result).toBe('result');
      expect(latencyMs).toBeGreaterThanOrEqual(50);
      expect(latencyMs).toBeLessThan(100);
    });
  });
});
