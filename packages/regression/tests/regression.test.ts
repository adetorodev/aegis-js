import { describe, expect, it } from 'vitest';
import { mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  BaselineManager,
  RegressionAnalyzer,
  ThresholdValidator,
  type BaselineData,
  type BaselineMetrics,
} from '../src/index.js';

describe('BaselineManager', () => {
  it('saves and loads baseline data from .aegis/baseline.json', async () => {
    const dir = join(tmpdir(), `aegis-regression-${Date.now()}`);
    await mkdir(dir, { recursive: true });

    const manager = new BaselineManager({ baseDir: dir });
    const baseline: BaselineData = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      dataset: 'dataset_v1',
      metrics: {
        score: 0.9,
        cost: 3.2,
        latency: 120,
        stdDeviation: 0.04,
      },
    };

    await manager.saveBaseline(baseline);
    const loaded = await manager.loadBaseline();

    expect(loaded).toEqual(baseline);

    await rm(dir, { recursive: true, force: true });
  });

  it('returns null when baseline file does not exist', async () => {
    const dir = join(tmpdir(), `aegis-regression-${Date.now()}`);
    await mkdir(dir, { recursive: true });

    const manager = new BaselineManager({ baseDir: dir });
    const loaded = await manager.loadBaseline();

    expect(loaded).toBeNull();

    await rm(dir, { recursive: true, force: true });
  });

  it('creates baseline from evaluation result', () => {
    const manager = new BaselineManager();

    const baseline = manager.createFromEvaluation(
      {
        cases: [],
        metrics: {
          meanScore: 0.88,
          minScore: 0.2,
          maxScore: 1,
          stdDeviation: 0.05,
          totalCost: 4.23,
          totalLatencyMs: 132,
          passedCases: 8,
          failedCases: 2,
        },
        timestamp: new Date().toISOString(),
        errors: [],
      },
      'dataset_v2'
    );

    expect(baseline.metrics.score).toBe(0.88);
    expect(baseline.metrics.cost).toBe(4.23);
    expect(baseline.metrics.latency).toBe(132);
    expect(baseline.dataset).toBe('dataset_v2');
  });
});

describe('RegressionAnalyzer', () => {
  const baseline: BaselineMetrics = {
    score: 0.9,
    cost: 5,
    latency: 100,
    stdDeviation: 0.05,
  };

  it('compares baseline and current metrics with deltas', () => {
    const analyzer = new RegressionAnalyzer();

    const report = analyzer.compare(baseline, {
      score: 0.85,
      cost: 6,
      latency: 120,
    });

    expect(report.score.delta).toBeCloseTo(-0.05, 10);
    expect(report.cost.delta).toBeCloseTo(1, 10);
    expect(report.latency.delta).toBeCloseTo(20, 10);
    expect(report.passed).toBe(true);
  });

  it('detects regressions based on absolute thresholds', () => {
    const analyzer = new RegressionAnalyzer();

    const report = analyzer.compare(
      baseline,
      {
        score: 0.7,
        cost: 6.5,
        latency: 140,
      },
      {
        score: { absoluteDrop: 0.1 },
        cost: { absoluteDrop: 1.0 },
        latency: { absoluteDrop: 20 },
      }
    );

    expect(report.passed).toBe(false);
    expect(report.score.hasFailed).toBe(true);
    expect(report.cost.hasFailed).toBe(true);
    expect(report.latency.hasFailed).toBe(true);
    expect(report.failures.length).toBeGreaterThan(0);
  });

  it('detects regressions based on percentage thresholds', () => {
    const analyzer = new RegressionAnalyzer();

    const report = analyzer.compare(
      baseline,
      {
        score: 0.75,
        cost: 6,
        latency: 130,
      },
      {
        score: { percentageDrop: 10 },
        cost: { percentageDrop: 15 },
        latency: { percentageDrop: 25 },
      }
    );

    expect(report.score.hasFailed).toBe(true); // ~16.67% drop
    expect(report.cost.hasFailed).toBe(true); // 20% increase
    expect(report.latency.hasFailed).toBe(true); // 30% increase
    expect(report.passed).toBe(false);
  });
});

describe('ThresholdValidator', () => {
  it('validate(report) reflects report pass/fail', () => {
    const validator = new ThresholdValidator({
      score: { absoluteDrop: 0.05 },
    });

    expect(
      validator.validate({
        score: {
          baseline: 1,
          current: 1,
          delta: 0,
          deltaPercent: 0,
          hasFailed: false,
          reasons: [],
        },
        cost: {
          baseline: 1,
          current: 1,
          delta: 0,
          deltaPercent: 0,
          hasFailed: false,
          reasons: [],
        },
        latency: {
          baseline: 1,
          current: 1,
          delta: 0,
          deltaPercent: 0,
          hasFailed: false,
          reasons: [],
        },
        passed: true,
        failures: [],
      })
    ).toBe(true);
  });

  it('validateMetric handles score drop direction', () => {
    const validator = new ThresholdValidator({
      score: { absoluteDrop: 0.1 },
    });

    const result = validator.validateMetric('score', 0.9, 0.7);
    expect(result.hasFailed).toBe(true);
  });

  it('validateMetric handles cost increase direction', () => {
    const validator = new ThresholdValidator({
      cost: { absoluteDrop: 1 },
    });

    const result = validator.validateMetric('cost', 5, 7);
    expect(result.hasFailed).toBe(true);
  });
});
