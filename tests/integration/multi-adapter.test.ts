import { describe, it, expect } from 'vitest';
import { DatasetLoader, Evaluator } from '@aegis-monitor/core';
import { MockAdapterFactory } from '@aegis-monitor/adapters';
import { ExactMatchScorer } from '@aegis-monitor/scorers';
import { CostCalculator, PricingRegistry } from '@aegis-monitor/cost';

describe('Integration: Multi-Adapter Comparison', () => {
  it('compares multiple adapters on the same dataset', async () => {
    const loader = new DatasetLoader();
    const dataset = loader.loadFromObject({
      cases: [
        { input: 'q1', expectedOutput: 'a1' },
        { input: 'q2', expectedOutput: 'a2' },
        { input: 'q3', expectedOutput: 'a3' },
      ],
    });

    const perfect = MockAdapterFactory.withGenerator((input) =>
      input.prompt.replace('q', 'a')
    );
    const mixed = MockAdapterFactory.withGenerator((input) =>
      input.prompt === 'q3' ? 'wrong' : input.prompt.replace('q', 'a')
    );
    const weak = MockAdapterFactory.withResponse('wrong');

    const scorer = new ExactMatchScorer();
    const [r1, r2, r3] = await Promise.all([
      new Evaluator(perfect, [scorer]).evaluate(dataset),
      new Evaluator(mixed, [scorer]).evaluate(dataset),
      new Evaluator(weak, [scorer]).evaluate(dataset),
    ]);

    expect(r1.metrics.meanScore).toBeGreaterThan(r2.metrics.meanScore);
    expect(r2.metrics.meanScore).toBeGreaterThan(r3.metrics.meanScore);

    const calc = new CostCalculator(new PricingRegistry());
    const totals = [r1, r2, r3].map((r) =>
      r.cases.reduce(
        (sum, c) => sum + calc.calculateCost('gpt-4', c.inputTokens, c.outputTokens),
        0
      )
    );

    totals.forEach((v) => expect(v).toBeGreaterThan(0));
  });

  it('supports concurrent runs for multiple adapters', async () => {
    const loader = new DatasetLoader();
    const dataset = loader.loadFromObject({
      cases: Array.from({ length: 30 }, (_, i) => ({
        input: `q${i}`,
        expectedOutput: `a${i}`,
      })),
    });

    const adapters = [
      MockAdapterFactory.withGenerator((i) => i.prompt.replace('q', 'a')),
      MockAdapterFactory.withGenerator((i) => i.prompt.replace('q', 'a')),
      MockAdapterFactory.withGenerator((i) => i.prompt.replace('q', 'a')),
    ];

    const start = Date.now();
    const results = await Promise.all(
      adapters.map((adapter) =>
        new Evaluator(adapter, [new ExactMatchScorer()], { concurrency: 10 }).evaluate(dataset)
      )
    );
    const duration = Date.now() - start;

    results.forEach((r) => expect(r.metrics.meanScore).toBe(1));
    expect(duration).toBeLessThan(5000);
  });
});
