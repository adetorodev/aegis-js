import { describe, expect, it } from 'vitest';
import {
  PricingRegistry,
  CostCalculator,
  ThresholdValidator,
  CumulativeCostTracker,
  DEFAULT_PRICING,
  type CostBreakdown,
} from '../src/index.js';

describe('PricingRegistry', () => {
  it('loads default pricing and resolves known model', () => {
    const registry = new PricingRegistry(DEFAULT_PRICING);
    const pricing = registry.getPricing('gpt-4');

    expect(pricing).toBeDefined();
    expect(pricing?.inputPrice).toBe(0.00003);
    expect(pricing?.outputPrice).toBe(0.00006);
  });

  it('supports setting and extending pricing table', () => {
    const registry = new PricingRegistry();

    registry.setPricing('custom-model', {
      inputPrice: 0.001,
      outputPrice: 0.002,
    });

    registry.extend({
      'another-model': { inputPrice: 0.0001, outputPrice: 0.0002 },
    });

    expect(registry.hasModel('custom-model')).toBe(true);
    expect(registry.hasModel('another-model')).toBe(true);
  });

  it('rejects negative pricing', () => {
    const registry = new PricingRegistry();

    expect(() =>
      registry.setPricing('bad-model', {
        inputPrice: -0.1,
        outputPrice: 0.2,
      })
    ).toThrow('cannot be negative');
  });
});

describe('CostCalculator', () => {
  const registry = new PricingRegistry({
    'test-model': {
      inputPrice: 0.00003,
      outputPrice: 0.00006,
      currency: 'USD',
    },
  });

  it('calculates per-request cost', () => {
    const calculator = new CostCalculator(registry);
    const total = calculator.calculateCost('test-model', 1000, 500);

    // (1000 * 0.00003) + (500 * 0.00006) = 0.03 + 0.03 = 0.06
    expect(total).toBeCloseTo(0.06, 10);
  });

  it('returns detailed cost breakdown', () => {
    const calculator = new CostCalculator(registry, { markupPercent: 10 });
    const breakdown = calculator.calculateBreakdown('test-model', 1000, 500);

    expect(breakdown.inputCost).toBeCloseTo(0.03, 10);
    expect(breakdown.outputCost).toBeCloseTo(0.03, 10);
    expect(breakdown.baseCost).toBeCloseTo(0.06, 10);
    expect(breakdown.markupAmount).toBeCloseTo(0.006, 10);
    expect(breakdown.totalCost).toBeCloseTo(0.066, 10);
    expect(breakdown.currency).toBe('USD');
  });

  it('throws for unknown model', () => {
    const calculator = new CostCalculator(registry);

    expect(() => calculator.calculateCost('unknown-model', 100, 100)).toThrow(
      'No pricing found'
    );
  });

  it('aggregates multiple costs', () => {
    const calculator = new CostCalculator(registry);

    const b1 = calculator.calculateBreakdown('test-model', 100, 100);
    const b2 = calculator.calculateBreakdown('test-model', 200, 100);

    const aggregated = calculator.aggregate([b1, b2]);

    expect(aggregated.totalCost).toBeCloseTo(b1.totalCost + b2.totalCost, 10);
    expect(aggregated.totalBaseCost).toBeCloseTo(b1.baseCost + b2.baseCost, 10);
  });
});

describe('ThresholdValidator', () => {
  it('returns ok when under thresholds', () => {
    const validator = new ThresholdValidator();
    const result = validator.validate(0.5, { warnAbove: 1, failAbove: 2 });

    expect(result.status).toBe('ok');
  });

  it('returns warn when over warn threshold', () => {
    const validator = new ThresholdValidator();
    const result = validator.validate(1.5, { warnAbove: 1, failAbove: 2 });

    expect(result.status).toBe('warn');
    expect(result.message).toContain('exceeds warning threshold');
  });

  it('returns fail when over fail threshold', () => {
    const validator = new ThresholdValidator();
    const result = validator.validate(2.5, { warnAbove: 1, failAbove: 2 });

    expect(result.status).toBe('fail');
    expect(result.message).toContain('exceeds fail threshold');
  });
});

describe('CumulativeCostTracker', () => {
  const breakdown = (model: string, totalCost: number): CostBreakdown => ({
    model,
    inputTokens: 0,
    outputTokens: 0,
    inputCost: 0,
    outputCost: 0,
    baseCost: totalCost,
    markupPercent: 0,
    markupAmount: 0,
    totalCost,
    currency: 'USD',
  });

  it('tracks cumulative and per-model totals', () => {
    const tracker = new CumulativeCostTracker();

    tracker.add(breakdown('gpt-4', 0.2));
    tracker.add(breakdown('gpt-4', 0.3));
    tracker.add(breakdown('gemini-pro', 0.1));

    expect(tracker.getTotalCost()).toBeCloseTo(0.6, 10);
    expect(tracker.getPerModelCost()['gpt-4']).toBeCloseTo(0.5, 10);
    expect(tracker.getPerModelCost()['gemini-pro']).toBeCloseTo(0.1, 10);
    expect(tracker.getBreakdowns()).toHaveLength(3);
  });

  it('resets tracked values', () => {
    const tracker = new CumulativeCostTracker();
    tracker.add(breakdown('gpt-4', 0.2));

    tracker.reset();

    expect(tracker.getTotalCost()).toBe(0);
    expect(tracker.getBreakdowns()).toHaveLength(0);
    expect(Object.keys(tracker.getPerModelCost())).toHaveLength(0);
  });
});
