import { describe, it, expect } from 'vitest';
import { DatasetLoader, Evaluator } from '@aegis-monitor/core';
import { MockAdapterFactory } from '@aegis-monitor/adapters';
import { ExactMatchScorer } from '@aegis-monitor/scorers';

describe('Performance: Benchmarks', () => {
  it('keeps evaluator overhead under 50ms for a single request', async () => {
    const loader = new DatasetLoader();
    const dataset = loader.loadFromObject({
      cases: [{ input: 'ping', expectedOutput: 'pong' }],
    });

    const adapter = MockAdapterFactory.withResponse('pong');
    const evaluator = new Evaluator(adapter, [new ExactMatchScorer()]);

    const start = Date.now();
    const result = await evaluator.evaluate(dataset);
    const elapsed = Date.now() - start;

    const adapterLatency = result.cases[0].latencyMs;
    const overhead = elapsed - adapterLatency;

    expect(result.metrics.meanScore).toBe(1);
    expect(overhead).toBeLessThan(50);
  });

  it('processes 10k+ cases', async () => {
    const CASES = 10_000;
    const loader = new DatasetLoader();
    const dataset = loader.loadFromObject({
      cases: Array.from({ length: CASES }, (_, i) => ({
        input: `q${i}`,
        expectedOutput: `a${i}`,
      })),
    });

    const adapter = MockAdapterFactory.withGenerator((input) => input.prompt.replace('q', 'a'));
    const evaluator = new Evaluator(adapter, [new ExactMatchScorer()], { concurrency: 50 });

    const start = Date.now();
    const result = await evaluator.evaluate(dataset);
    const elapsed = Date.now() - start;

    expect(result.cases).toHaveLength(CASES);
    expect(result.metrics.meanScore).toBe(1);
    expect(elapsed).toBeLessThan(30000);
  });

  it('shows concurrency benefit', async () => {
    const loader = new DatasetLoader();
    const dataset = loader.loadFromObject({
      cases: Array.from({ length: 200 }, (_, i) => ({
        input: `q${i}`,
        expectedOutput: `a${i}`,
      })),
    });

    const adapter = MockAdapterFactory.withGenerator((input) => input.prompt.replace('q', 'a'));
    const scorer = new ExactMatchScorer();

    const t1 = Date.now();
    await new Evaluator(adapter, [scorer], { concurrency: 1 }).evaluate(dataset);
    const sequential = Date.now() - t1;

    const t2 = Date.now();
    await new Evaluator(adapter, [scorer], { concurrency: 20 }).evaluate(dataset);
    const concurrent = Date.now() - t2;

    expect(concurrent).toBeLessThan(sequential);
  });

  it('profiles memory growth on large datasets', async () => {
    const loader = new DatasetLoader();
    const dataset = loader.loadFromObject({
      cases: Array.from({ length: 5_000 }, (_, i) => ({
        input: `q${i}`,
        expectedOutput: `a${i}`,
      })),
    });

    const before = process.memoryUsage().heapUsed;

    const adapter = MockAdapterFactory.withGenerator((input) => input.prompt.replace('q', 'a'));
    const evaluator = new Evaluator(adapter, [new ExactMatchScorer()], { concurrency: 50 });
    const result = await evaluator.evaluate(dataset);

    const after = process.memoryUsage().heapUsed;
    const growthMb = (after - before) / 1024 / 1024;

    expect(result.cases).toHaveLength(5_000);
    expect(growthMb).toBeLessThan(150);
  });
});
