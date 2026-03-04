import { describe, it, expect } from 'vitest';
import { DatasetLoader, Evaluator } from '@aegis-monitor/core';
import { MockAdapterFactory } from '@aegis-monitor/adapters';
import { ExactMatchScorer } from '@aegis-monitor/scorers';
import { CostCalculator, PricingRegistry } from '@aegis-monitor/cost';
import { BaselineManager, RegressionAnalyzer } from '@aegis-monitor/regression';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

describe('Integration: Regression Detection Workflow', () => {
  it('detects score/cost/latency regressions from baseline', async () => {
    const loader = new DatasetLoader();
    const dataset = loader.loadFromObject({
      cases: [
        { input: 'q1', expectedOutput: 'a1' },
        { input: 'q2', expectedOutput: 'a2' },
        { input: 'q3', expectedOutput: 'a3' },
      ],
    });

    const good = MockAdapterFactory.withGenerator((input) => input.prompt.replace('q', 'a'));
    const scorer = new ExactMatchScorer();
    const baselineResult = await new Evaluator(good, [scorer]).evaluate(dataset);

    const calc = new CostCalculator(new PricingRegistry());
    const baselineCost = baselineResult.cases.reduce(
      (sum, c) => sum + calc.calculateCost('gpt-4', c.inputTokens, c.outputTokens),
      0
    );

    const dir = await mkdtemp(join(tmpdir(), 'aegis-reg-'));
    const manager = new BaselineManager({ baseDir: dir });
    await manager.saveBaseline({
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      dataset: 'regression-dataset',
      metrics: {
        score: baselineResult.metrics.meanScore,
        cost: baselineCost,
        latency: baselineResult.metrics.totalLatencyMs,
        stdDeviation: baselineResult.metrics.stdDeviation,
      },
    });

    const degraded = MockAdapterFactory.withGenerator((input) =>
      input.prompt === 'q3' ? 'wrong' : input.prompt.replace('q', 'a')
    );
    const currentResult = await new Evaluator(degraded, [scorer]).evaluate(dataset);
    const currentCost = currentResult.cases.reduce(
      (sum, c) => sum + calc.calculateCost('gpt-4', c.inputTokens * 2, c.outputTokens * 2),
      0
    );

    const baseline = await manager.loadBaseline();
    expect(baseline).not.toBeNull();

    const analyzer = new RegressionAnalyzer();
    const report = analyzer.compare(
      baseline!.metrics,
      {
        score: currentResult.metrics.meanScore,
        cost: currentCost,
        latency: currentResult.metrics.totalLatencyMs + 100,
        stdDeviation: currentResult.metrics.stdDeviation,
      },
      {
        score: { percentageDrop: 10 },
        cost: { percentageDrop: 10 },
        latency: { absoluteDrop: 10 },
      }
    );

    expect(report.score.hasFailed).toBe(true);
    expect(report.cost.hasFailed).toBe(true);
    expect(report.latency.hasFailed).toBe(true);
    expect(report.passed).toBe(false);

    await rm(dir, { recursive: true, force: true });
  });
});
