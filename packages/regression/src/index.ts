/**
 * @aegis-monitor/regression
 * Regression detection and baseline management for Aegis Monitor
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { EvaluationResult } from '@aegis-monitor/core';

export interface BaselineMetrics {
  score: number;
  cost: number;
  latency: number;
  stdDeviation?: number;
}

export interface BaselineData {
  version: string;
  timestamp: string;
  metrics: BaselineMetrics;
  dataset?: string;
}

export interface BaselineManagerOptions {
  baseDir?: string;
  baselineFileName?: string;
  version?: string;
}

export interface MetricComparison {
  baseline: number;
  current: number;
  delta: number;
  deltaPercent: number;
  hasFailed: boolean;
  reasons: string[];
}

export interface RegressionReport {
  score: MetricComparison;
  cost: MetricComparison;
  latency: MetricComparison;
  passed: boolean;
  failures: string[];
}

export interface MetricThreshold {
  absoluteDrop?: number;
  percentageDrop?: number;
}

export interface RegressionThresholds {
  score?: MetricThreshold;
  cost?: MetricThreshold;
  latency?: MetricThreshold;
}

export class BaselineManager {
  private readonly baselinePath: string;
  private readonly version: string;

  constructor(options: BaselineManagerOptions = {}) {
    const baseDir = options.baseDir ?? process.cwd();
    const baselineFileName = options.baselineFileName ?? 'baseline.json';
    this.baselinePath = join(baseDir, '.aegis', baselineFileName);
    this.version = options.version ?? '1.0.0';
  }

  async saveBaseline(data: BaselineData): Promise<void> {
    await mkdir(dirname(this.baselinePath), { recursive: true });
    await writeFile(this.baselinePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  async saveFromEvaluation(
    result: EvaluationResult,
    dataset?: string
  ): Promise<BaselineData> {
    const baseline = this.createFromEvaluation(result, dataset);
    await this.saveBaseline(baseline);
    return baseline;
  }

  createFromEvaluation(result: EvaluationResult, dataset?: string): BaselineData {
    return {
      version: this.version,
      timestamp: new Date().toISOString(),
      dataset,
      metrics: {
        score: result.metrics.meanScore,
        cost: result.metrics.totalCost,
        latency: result.metrics.totalLatencyMs,
        stdDeviation: result.metrics.stdDeviation,
      },
    };
  }

  async loadBaseline(): Promise<BaselineData | null> {
    try {
      const content = await readFile(this.baselinePath, 'utf-8');
      return JSON.parse(content) as BaselineData;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes('ENOENT')) {
        return null;
      }
      throw error;
    }
  }
}

export class RegressionAnalyzer {
  compare(
    baseline: BaselineMetrics,
    current: BaselineMetrics,
    thresholds?: RegressionThresholds
  ): RegressionReport {
    const validator = new ThresholdValidator(thresholds ?? {});

    const score = this.buildComparison('score', baseline.score, current.score, validator);
    const cost = this.buildComparison('cost', baseline.cost, current.cost, validator);
    const latency = this.buildComparison('latency', baseline.latency, current.latency, validator);

    const failures = [
      ...score.reasons.map((reason) => `score: ${reason}`),
      ...cost.reasons.map((reason) => `cost: ${reason}`),
      ...latency.reasons.map((reason) => `latency: ${reason}`),
    ];

    return {
      score,
      cost,
      latency,
      passed: failures.length === 0,
      failures,
    };
  }

  private buildComparison(
    metric: keyof RegressionThresholds,
    baselineValue: number,
    currentValue: number,
    validator: ThresholdValidator
  ): MetricComparison {
    const delta = currentValue - baselineValue;
    const deltaPercent = baselineValue === 0 ? 0 : (delta / baselineValue) * 100;
    const result = validator.validateMetric(metric, baselineValue, currentValue);

    return {
      baseline: baselineValue,
      current: currentValue,
      delta,
      deltaPercent,
      hasFailed: result.hasFailed,
      reasons: result.reasons,
    };
  }
}

export class ThresholdValidator {
  constructor(private readonly thresholds: RegressionThresholds) {}

  validate(report: RegressionReport): boolean {
    return report.passed;
  }

  validateMetric(
    metric: keyof RegressionThresholds,
    baselineValue: number,
    currentValue: number
  ): { hasFailed: boolean; reasons: string[] } {
    const config = this.thresholds[metric];
    if (!config) {
      return { hasFailed: false, reasons: [] };
    }

    const isIncreaseRegression = metric === 'cost' || metric === 'latency';
    const delta = currentValue - baselineValue;
    const dropMagnitude = isIncreaseRegression ? delta : -delta;
    const percentageDrop =
      baselineValue === 0 ? 0 : (dropMagnitude / baselineValue) * 100;

    const reasons: string[] = [];

    if (
      config.absoluteDrop !== undefined &&
      dropMagnitude > config.absoluteDrop
    ) {
      reasons.push(
        `absolute threshold exceeded (${dropMagnitude.toFixed(6)} > ${config.absoluteDrop.toFixed(6)})`
      );
    }

    if (
      config.percentageDrop !== undefined &&
      percentageDrop > config.percentageDrop
    ) {
      reasons.push(
        `percentage threshold exceeded (${percentageDrop.toFixed(2)}% > ${config.percentageDrop.toFixed(2)}%)`
      );
    }

    return {
      hasFailed: reasons.length > 0,
      reasons,
    };
  }
}
