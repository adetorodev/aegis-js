import { describe, it, expect } from 'vitest';
import { DatasetLoader, Evaluator } from '@aegis-monitor/core';
import { MockAdapterFactory } from '@aegis-monitor/adapters';
import { ExactMatchScorer } from '@aegis-monitor/scorers';
import { CostCalculator, PricingRegistry, CumulativeCostTracker } from '@aegis-monitor/cost';
import { BaselineManager, RegressionAnalyzer } from '@aegis-monitor/regression';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('Integration: Full Workflow', () => {
  it('runs dataset -> adapter -> scorer -> cost -> baseline end-to-end', async () => {
    const loader = new DatasetLoader();
    const dataset = loader.loadFromObject({
      cases: [
        { input: '2+2', expectedOutput: '4' },
        { input: 'capital of France', expectedOutput: 'Paris' },
      ],
    });

    const adapter = MockAdapterFactory.withGenerator((input) => {
      if (input.prompt.includes('2+2')) return '4';
      if (input.prompt.includes('France')) return 'Paris';
      return 'unknown';
    });

    const evaluator = new Evaluator(adapter, [new ExactMatchScorer()], { concurrency: 2 });
    const result = await evaluator.evaluate(dataset);

    expect(result.cases).toHaveLength(2);
    expect(result.metrics.meanScore).toBe(1);
    expect(result.metrics.failedCases).toBe(0);

    const calculator = new CostCalculator(new PricingRegistry());
    const tracker = new CumulativeCostTracker();

    for (const item of result.cases) {
      const breakdown = calculator.calculateBreakdown('gpt-4', item.inputTokens, item.outputTokens);
      tracker.add(breakdown);
    }

    expect(tracker.getTotalCost()).toBeGreaterThan(0);

    const dir = await mkdtemp(join(tmpdir(), 'aegis-it-'));
    const manager = new BaselineManager({ baseDir: dir });
    const baseline = await manager.saveFromEvaluation(result, 'integration-dataset');

    expect(baseline.metrics.score).toBe(1);

    const analyzer = new RegressionAnalyzer();
    const report = analyzer.compare(baseline.metrics, {
      score: 0.9,
      cost: baseline.metrics.cost + 0.001,
      latency: baseline.metrics.latency,
      stdDeviation: baseline.metrics.stdDeviation,
    });

    expect(report.score.delta).toBeLessThan(0);
    expect(report.cost.delta).toBeGreaterThan(0);

    await rm(dir, { recursive: true, force: true });
  });

  it('supports continue-on-error in full flow', async () => {
    const loader = new DatasetLoader();
    const dataset = loader.loadFromObject({
      cases: [
        { input: 'one', expectedOutput: 'one' },
        { input: 'two', expectedOutput: 'two' },
      ],
    });

    let calls = 0;
    const adapter = MockAdapterFactory.withGenerator(() => {
      calls += 1;
      if (calls === 2) {
        throw new Error('boom');
      }
      return 'one';
    });

    const evaluator = new Evaluator(adapter, [new ExactMatchScorer()], {
      errorHandling: 'continue-on-error',
    });

    const result = await evaluator.evaluate(dataset);

    expect(result.cases).toHaveLength(2);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.metrics.failedCases).toBeGreaterThan(0);
  });
});
