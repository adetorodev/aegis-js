import { describe, it, expect } from 'vitest';
import {
  Evaluator,
  Dataset,
  GenerateOutput,
  ILLMAdapter,
  Scorer,
  RateLimitError,
} from '../src/index.js';

// Mock implementations
class MockAdapter implements ILLMAdapter {
  constructor(
    private responses:
      | Partial<GenerateOutput>
      | Partial<GenerateOutput>[]
      | ((input: string) => Partial<GenerateOutput>)
  ) {}

  async generate(input: { prompt: string }): Promise<GenerateOutput> {
    const response =
      typeof this.responses === 'function'
        ? this.responses(input.prompt)
        : Array.isArray(this.responses)
          ? this.responses[0]
          : this.responses;

    return {
      text: (response as Record<string, unknown>).text || 'mock response',
      inputTokens: ((response as Record<string, unknown>).inputTokens as number) || 10,
      outputTokens: ((response as Record<string, unknown>).outputTokens as number) || 20,
      latencyMs: ((response as Record<string, unknown>).latencyMs as number) || 100,
      ...(response as Record<string, unknown>),
    };
  }
}

class MockScorer implements Scorer {
  constructor(private scoreValue: number) {}

  score(_expected: string, _actual: string): number {
    return this.scoreValue;
  }
}

describe('Evaluator', () => {
  describe('Basic Evaluation', () => {
    it('evaluates a single case', async () => {
      const adapter = new MockAdapter([{ text: 'Hello' }]);
      const scorer = new MockScorer(1.0);
      const evaluator = new Evaluator(adapter, [scorer]);

      const dataset: Dataset = {
        cases: [
          {
            input: 'Say hello',
            expectedOutput: 'Hello',
          },
        ],
      };

      const result = await evaluator.evaluate(dataset);

      expect(result.cases).toHaveLength(1);
      expect(result.cases[0].score).toBe(1.0);
      expect(result.cases[0].output).toBe('Hello');
      expect(result.metrics.meanScore).toBe(1.0);
      expect(result.metrics.passedCases).toBe(1);
      expect(result.metrics.failedCases).toBe(0);
    });

    it('evaluates multiple cases', async () => {
      const adapter = new MockAdapter({ text: 'response' });
      const scorer = new MockScorer(0.5);
      const evaluator = new Evaluator(adapter, [scorer]);

      const dataset: Dataset = {
        cases: [
          { input: 'test1', expectedOutput: 'expected1' },
          { input: 'test2', expectedOutput: 'expected2' },
          { input: 'test3', expectedOutput: 'expected3' },
        ],
      };

      const result = await evaluator.evaluate(dataset);

      expect(result.cases).toHaveLength(3);
      expect(result.metrics.meanScore).toBe(0.5);
      expect(result.metrics.passedCases).toBe(0); // All below default threshold
    });

    it('combines multiple scorers with averaging', async () => {
      const adapter = new MockAdapter({ text: 'response' });
      const scorer1 = new MockScorer(1.0);
      const scorer2 = new MockScorer(0.0);
      const evaluator = new Evaluator(adapter, [scorer1, scorer2]);

      const dataset: Dataset = {
        cases: [{ input: 'test', expectedOutput: 'expected' }],
      };

      const result = await evaluator.evaluate(dataset);

      // Average of 1.0 and 0.0 = 0.5
      expect(result.cases[0].score).toBe(0.5);
    });
  });

  describe('Metrics Aggregation', () => {
    it('calculates correct aggregated metrics', async () => {
      // Scores: 0.3, 0.5, 0.7, 0.9
      const scores = [0.3, 0.5, 0.7, 0.9];
      const adapters = [
        new MockAdapter({ text: 'r1' }),
        new MockAdapter({ text: 'r2' }),
        new MockAdapter({ text: 'r3' }),
        new MockAdapter({ text: 'r4' }),
      ];

      const scorers = scores.map((s) => new MockScorer(s));

      const dataset: Dataset = {
        cases: [{ input: 'test', expectedOutput: 'expected' }],
      };

      // Test each score
      for (let i = 0; i < scores.length; i++) {
        const evaluator = new Evaluator(adapters[i], [scorers[i]]);
        const result = await evaluator.evaluate(dataset);
        expect(result.cases[0].score).toBeCloseTo(scores[i], 5);
      }
    });

    it('calculates standard deviation correctly', async () => {
      const adapter = new MockAdapter({ text: 'response' });
      // Create evaluator with varied scores
      const allScores = [0.4, 0.6, 0.8];
      const scorers = allScores.map((s) => new MockScorer(s));
      const evaluator = new Evaluator(adapter, scorers);

      const dataset: Dataset = {
        cases: [{ input: 'test', expectedOutput: 'expected' }],
      };

      const result = await evaluator.evaluate(dataset);

      // Standard deviation is computed across case scores.
      // This dataset has one case, so std deviation should be 0.
      expect(result.metrics.stdDeviation).toBe(0);
    });

    it('tracks passed and failed cases based on threshold', async () => {
      const adapter = new MockAdapter({ text: 'response' });
      const passScorer = new MockScorer(0.8); // Above default 0.0 threshold
      const failScorer = new MockScorer(0.0);

      const dataset: Dataset = {
        cases: [
          { input: 'test1', expectedOutput: 'expected1' },
          { input: 'test2', expectedOutput: 'expected2' },
        ],
      };

      const evaluator1 = new Evaluator(adapter, [passScorer]);
      const result1 = await evaluator1.evaluate(dataset);
      expect(result1.metrics.passedCases).toBe(2);

      const evaluator2 = new Evaluator(adapter, [failScorer]);
      const result2 = await evaluator2.evaluate(dataset);
      expect(result2.metrics.failedCases).toBe(0); // No actual errors
    });
  });

  describe('Concurrency Control', () => {
    it('handles concurrent execution without errors', async () => {
      let callCount = 0;
      const adapter: ILLMAdapter = {
        async generate() {
          callCount++;
          return {
            text: 'response',
            inputTokens: 10,
            outputTokens: 20,
            latencyMs: 10,
          };
        },
      };

      const scorer = new MockScorer(0.5);
      const evaluator = new Evaluator(adapter, [scorer]);

      const dataset: Dataset = {
        cases: Array(20)
          .fill(0)
          .map((_, i) => ({
            input: `test${i}`,
            expectedOutput: `expected${i}`,
          })),
      };

      const result = await evaluator.evaluate(dataset);

      expect(result.cases).toHaveLength(20);
      expect(callCount).toBe(20);
    });
  });

  describe('Error Handling', () => {
    it('handles continue-on-error mode', async () => {
      let callCount = 0;
      const adapter: ILLMAdapter = {
        async generate() {
          callCount++;
          if (callCount === 2) {
            throw new Error('Simulated error');
          }
          return {
            text: 'response',
            inputTokens: 10,
            outputTokens: 20,
            latencyMs: 10,
          };
        },
      };

      const scorer = new MockScorer(1.0);
      const evaluator = new Evaluator(adapter, [scorer]);

      const dataset: Dataset = {
        cases: [
          { input: 'test1', expectedOutput: 'expected1' },
          { input: 'test2', expectedOutput: 'expected2' },
          { input: 'test3', expectedOutput: 'expected3' },
        ],
      };

      const result = await evaluator.evaluate(dataset);

      expect(result.cases).toHaveLength(3);
      expect(result.cases[1].error).toBeDefined();
      expect(result.errors).toHaveLength(1);
      expect(result.metrics.failedCases).toBe(1);
    });

    it('includes error messages in results', async () => {
      const adapter: ILLMAdapter = {
        async generate() {
          throw new Error('API error');
        },
      };

      const scorer = new MockScorer(0.5);
      const evaluator = new Evaluator(adapter, [scorer]);

      const dataset: Dataset = {
        cases: [{ input: 'test', expectedOutput: 'expected' }],
      };

      const result = await evaluator.evaluate(dataset);

      expect(result.cases[0].error).toBeDefined();
      expect(result.errors.some((msg) => msg.includes('API error'))).toBe(true);
    });

    it('tracks error cases correctly', async () => {
      let callCount = 0;
      const adapter: ILLMAdapter = {
        async generate() {
          callCount++;
          if (callCount % 2 === 0) {
            throw new Error('Error on even calls');
          }
          return {
            text: 'response',
            inputTokens: 10,
            outputTokens: 20,
            latencyMs: 10,
          };
        },
      };

      const scorer = new MockScorer(1.0);
      const evaluator = new Evaluator(adapter, [scorer]);

      const dataset: Dataset = {
        cases: [
          { input: 'test1', expectedOutput: 'expected1' },
          { input: 'test2', expectedOutput: 'expected2' },
          { input: 'test3', expectedOutput: 'expected3' },
          { input: 'test4', expectedOutput: 'expected4' },
        ],
      };

      const result = await evaluator.evaluate(dataset);

      expect(result.metrics.failedCases).toBe(2);
      expect(result.cases.filter((c) => c.error)).toHaveLength(2);
    });
  });

  describe('Rate Limiting', () => {
    it('retries on rate limit error', async () => {
      let attempts = 0;
      const adapter: ILLMAdapter = {
        async generate() {
          attempts++;
          if (attempts === 1) {
            throw new RateLimitError('Rate limited', 10);
          }
          return {
            text: 'response',
            inputTokens: 10,
            outputTokens: 20,
            latencyMs: 10,
          };
        },
      };

      const scorer = new MockScorer(1.0);
      const evaluator = new Evaluator(adapter, [scorer]);

      const dataset: Dataset = {
        cases: [{ input: 'test', expectedOutput: 'expected' }],
      };

      const result = await evaluator.evaluate(dataset);

      expect(attempts).toBeGreaterThan(1);
      expect(result.cases[0].score).toBe(1.0);
    });
  });

  describe('Result Structure', () => {
    it('returns properly structured result', async () => {
      const adapter = new MockAdapter({ text: 'response', inputTokens: 5, outputTokens: 15 });
      const scorer = new MockScorer(0.75);
      const evaluator = new Evaluator(adapter, [scorer]);

      const dataset: Dataset = {
        cases: [{ input: 'test', expectedOutput: 'expected' }],
      };

      const result = await evaluator.evaluate(dataset);

      expect(result).toHaveProperty('cases');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('errors');

      expect(result.cases[0]).toHaveProperty('caseIndex');
      expect(result.cases[0]).toHaveProperty('score');
      expect(result.cases[0]).toHaveProperty('latencyMs');
      expect(result.cases[0]).toHaveProperty('inputTokens');
      expect(result.cases[0]).toHaveProperty('outputTokens');
      expect(result.cases[0]).toHaveProperty('output');

      expect(result.metrics).toHaveProperty('meanScore');
      expect(result.metrics).toHaveProperty('minScore');
      expect(result.metrics).toHaveProperty('maxScore');
      expect(result.metrics).toHaveProperty('stdDeviation');
      expect(result.metrics).toHaveProperty('totalCost');
      expect(result.metrics).toHaveProperty('totalLatencyMs');
      expect(result.metrics).toHaveProperty('passedCases');
      expect(result.metrics).toHaveProperty('failedCases');

      expect(typeof result.timestamp).toBe('string');
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it('includes case metadata in results', async () => {
      const adapter = new MockAdapter({ text: 'response' });
      const scorer = new MockScorer(1.0);
      const evaluator = new Evaluator(adapter, [scorer]);

      const dataset: Dataset = {
        cases: [
          {
            input: 'test',
            expectedOutput: 'expected',
            metadata: { id: 'test-1', category: 'unit' },
          },
        ],
      };

      const result = await evaluator.evaluate(dataset);

      expect(result.cases[0].caseIndex).toBe(0);
      expect(result.cases[0].output).toBe('response');
    });

    it('record token counts from adapter', async () => {
      const adapter = new MockAdapter({
        text: 'response',
        inputTokens: 25,
        outputTokens: 50,
      });
      const scorer = new MockScorer(1.0);
      const evaluator = new Evaluator(adapter, [scorer]);

      const dataset: Dataset = {
        cases: [{ input: 'test', expectedOutput: 'expected' }],
      };

      const result = await evaluator.evaluate(dataset);

      expect(result.cases[0].inputTokens).toBe(25);
      expect(result.cases[0].outputTokens).toBe(50);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty dataset', async () => {
      const adapter = new MockAdapter({ text: 'response' });
      const scorer = new MockScorer(1.0);
      const evaluator = new Evaluator(adapter, [scorer]);

      const dataset: Dataset = {
        cases: [],
      };

      const result = await evaluator.evaluate(dataset);

      expect(result.cases).toHaveLength(0);
      expect(result.metrics.meanScore).toBe(0);
      expect(result.metrics.passedCases).toBe(0);
    });

    it('throws when no scorers provided', () => {
      const adapter = new MockAdapter({ text: 'response' });
      expect(() => new Evaluator(adapter, [])).toThrow();
    });

    it('handles special characters in input/output', async () => {
      const specialInput = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const adapter: ILLMAdapter = {
        async generate(input) {
          return {
            text: input.prompt,
            inputTokens: 10,
            outputTokens: 20,
            latencyMs: 10,
          };
        },
      };

      const scorer = new MockScorer(1.0);
      const evaluator = new Evaluator(adapter, [scorer]);

      const dataset: Dataset = {
        cases: [{ input: specialInput, expectedOutput: specialInput }],
      };

      const result = await evaluator.evaluate(dataset);

      expect(result.cases[0].output).toBe(specialInput);
    });

    it('handles very long inputs', async () => {
      const longInput = 'a'.repeat(10000);
      const adapter: ILLMAdapter = {
        async generate() {
          return {
            text: 'response',
            inputTokens: 10,
            outputTokens: 20,
            latencyMs: 10,
          };
        },
      };

      const scorer = new MockScorer(1.0);
      const evaluator = new Evaluator(adapter, [scorer]);

      const dataset: Dataset = {
        cases: [{ input: longInput, expectedOutput: 'expected' }],
      };

      const result = await evaluator.evaluate(dataset);

      expect(result.cases[0].score).toBe(1.0);
    });
  });
});
