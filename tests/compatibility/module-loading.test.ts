import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

describe('Compatibility: Module Loading', () => {
  it('loads all workspace packages via ESM imports', async () => {
    const core = await import('@aegis-monitor/core');
    const adapters = await import('@aegis-monitor/adapters');
    const scorers = await import('@aegis-monitor/scorers');
    const cost = await import('@aegis-monitor/cost');
    const regression = await import('@aegis-monitor/regression');

    expect(core.Evaluator).toBeDefined();
    expect(adapters.MockAdapterFactory).toBeDefined();
    expect(scorers.ExactMatchScorer).toBeDefined();
    expect(cost.CostCalculator).toBeDefined();
    expect(regression.RegressionAnalyzer).toBeDefined();
  });

  it('loads packages through CJS require path', () => {
    const require = createRequire(import.meta.url);

    const core = require('@aegis-monitor/core');
    const adapters = require('@aegis-monitor/adapters');

    expect(core.Evaluator).toBeDefined();
    expect(adapters.MockAdapterFactory).toBeDefined();
  });

  it('verifies cross-package interoperability', async () => {
    const { DatasetLoader, Evaluator } = await import('@aegis-monitor/core');
    const { MockAdapterFactory } = await import('@aegis-monitor/adapters');
    const { ExactMatchScorer } = await import('@aegis-monitor/scorers');

    const loader = new DatasetLoader();
    const dataset = loader.loadFromObject({
      cases: [{ input: 'hello', expectedOutput: 'hello' }],
    });

    const evaluator = new Evaluator(
      MockAdapterFactory.withResponse('hello'),
      [new ExactMatchScorer()]
    );

    const result = await evaluator.evaluate(dataset);
    expect(result.metrics.meanScore).toBe(1);
  });
});

describe('Compatibility: Runtime Targets', () => {
  it('runs on Node.js 18+', () => {
    const major = Number(process.version.slice(1).split('.')[0]);
    expect(major).toBeGreaterThanOrEqual(18);
  });

  it('supports modern runtime APIs needed by SDK', () => {
    expect(typeof Promise.allSettled).toBe('function');
    expect(typeof fetch).toBe('function');
  });

  it('keeps core/scorer/cost imports edge-compatible as a smoke check', async () => {
    const core = await import('@aegis-monitor/core');
    const scorers = await import('@aegis-monitor/scorers');
    const cost = await import('@aegis-monitor/cost');

    expect(core.Evaluator).toBeDefined();
    expect(scorers.ExactMatchScorer).toBeDefined();
    expect(cost.CostCalculator).toBeDefined();
  });
});
