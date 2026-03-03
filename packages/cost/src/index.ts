/**
 * @aegis-monitor/cost
 * Cost calculation and tracking for Aegis Monitor
 */

export type CurrencyCode = 'USD';

/**
 * Model pricing in USD per token.
 */
export interface ModelPricing {
  inputPrice: number;
  outputPrice: number;
  currency?: CurrencyCode;
}

export type PricingTable = Record<string, ModelPricing>;

/**
 * Default pricing table (USD per token).
 */
export const DEFAULT_PRICING: PricingTable = {
  'gpt-4': {
    inputPrice: 0.00003,
    outputPrice: 0.00006,
    currency: 'USD',
  },
  'gpt-3.5-turbo': {
    inputPrice: 0.0000015,
    outputPrice: 0.000002,
    currency: 'USD',
  },
  'claude-3-opus': {
    inputPrice: 0.000015,
    outputPrice: 0.000075,
    currency: 'USD',
  },
  'gemini-pro': {
    inputPrice: 0.0000005,
    outputPrice: 0.0000015,
    currency: 'USD',
  },
};

/**
 * Registry for model pricing with runtime override/extension support.
 */
export class PricingRegistry {
  private table: PricingTable;

  constructor(initialPricing: PricingTable = DEFAULT_PRICING) {
    this.table = this.normalizeTable(initialPricing);
  }

  getPricing(model: string): ModelPricing | undefined {
    return this.table[this.normalizeModel(model)];
  }

  hasModel(model: string): boolean {
    return this.getPricing(model) !== undefined;
  }

  setPricing(model: string, pricing: ModelPricing): void {
    this.validatePricing(pricing);
    this.table[this.normalizeModel(model)] = {
      ...pricing,
      currency: pricing.currency ?? 'USD',
    };
  }

  extend(entries: PricingTable): void {
    for (const [model, pricing] of Object.entries(entries)) {
      this.setPricing(model, pricing);
    }
  }

  toJSON(): PricingTable {
    return { ...this.table };
  }

  private normalizeModel(model: string): string {
    return model.trim().toLowerCase();
  }

  private normalizeTable(table: PricingTable): PricingTable {
    const normalized: PricingTable = {};
    for (const [model, pricing] of Object.entries(table)) {
      this.validatePricing(pricing);
      normalized[this.normalizeModel(model)] = {
        ...pricing,
        currency: pricing.currency ?? 'USD',
      };
    }
    return normalized;
  }

  private validatePricing(pricing: ModelPricing): void {
    if (pricing.inputPrice < 0 || pricing.outputPrice < 0) {
      throw new Error('Model pricing cannot be negative');
    }
  }
}

export interface CostBreakdown {
  model: string;
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  baseCost: number;
  markupPercent: number;
  markupAmount: number;
  totalCost: number;
  currency: CurrencyCode;
}

export interface CostCalculatorOptions {
  markupPercent?: number;
  currency?: CurrencyCode;
}

export interface BudgetThresholds {
  warnAbove?: number;
  failAbove?: number;
}

export interface BudgetValidationResult {
  status: 'ok' | 'warn' | 'fail';
  totalCost: number;
  thresholds: BudgetThresholds;
  message?: string;
}

/**
 * Cost calculator for per-request and aggregated run cost.
 */
export class CostCalculator {
  private readonly markupPercent: number;
  private readonly defaultCurrency: CurrencyCode;

  constructor(
    private readonly registry: PricingRegistry,
    options: CostCalculatorOptions = {}
  ) {
    this.markupPercent = options.markupPercent ?? 0;
    this.defaultCurrency = options.currency ?? 'USD';
  }

  calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    return this.calculateBreakdown(model, inputTokens, outputTokens).totalCost;
  }

  calculateBreakdown(
    model: string,
    inputTokens: number,
    outputTokens: number,
    markupPercent = this.markupPercent
  ): CostBreakdown {
    if (inputTokens < 0 || outputTokens < 0) {
      throw new Error('Token counts must be non-negative');
    }

    const pricing = this.registry.getPricing(model);
    if (!pricing) {
      throw new Error(`No pricing found for model: ${model}`);
    }

    const inputCost = inputTokens * pricing.inputPrice;
    const outputCost = outputTokens * pricing.outputPrice;
    const baseCost = inputCost + outputCost;
    const markupAmount = baseCost * (markupPercent / 100);
    const totalCost = baseCost + markupAmount;

    return {
      model,
      inputTokens,
      outputTokens,
      inputCost,
      outputCost,
      baseCost,
      markupPercent,
      markupAmount,
      totalCost,
      currency: pricing.currency ?? this.defaultCurrency,
    };
  }

  aggregate(breakdowns: CostBreakdown[]): {
    totalBaseCost: number;
    totalMarkup: number;
    totalCost: number;
    currency: CurrencyCode;
  } {
    const totalBaseCost = breakdowns.reduce((sum, b) => sum + b.baseCost, 0);
    const totalMarkup = breakdowns.reduce((sum, b) => sum + b.markupAmount, 0);
    const totalCost = breakdowns.reduce((sum, b) => sum + b.totalCost, 0);

    return {
      totalBaseCost,
      totalMarkup,
      totalCost,
      currency: this.defaultCurrency,
    };
  }
}

/**
 * Budget threshold validator.
 */
export class ThresholdValidator {
  validate(totalCost: number, thresholds: BudgetThresholds): BudgetValidationResult {
    if (thresholds.failAbove !== undefined && totalCost > thresholds.failAbove) {
      return {
        status: 'fail',
        totalCost,
        thresholds,
        message: `Total cost ${totalCost.toFixed(6)} exceeds fail threshold ${thresholds.failAbove.toFixed(6)}`,
      };
    }

    if (thresholds.warnAbove !== undefined && totalCost > thresholds.warnAbove) {
      return {
        status: 'warn',
        totalCost,
        thresholds,
        message: `Total cost ${totalCost.toFixed(6)} exceeds warning threshold ${thresholds.warnAbove.toFixed(6)}`,
      };
    }

    return {
      status: 'ok',
      totalCost,
      thresholds,
    };
  }
}

/**
 * Tracks cumulative run cost and per-model cost breakdown.
 */
export class CumulativeCostTracker {
  private totalCost = 0;
  private perModelCost = new Map<string, number>();
  private breakdowns: CostBreakdown[] = [];

  add(breakdown: CostBreakdown): void {
    this.breakdowns.push(breakdown);
    this.totalCost += breakdown.totalCost;

    const current = this.perModelCost.get(breakdown.model) ?? 0;
    this.perModelCost.set(breakdown.model, current + breakdown.totalCost);
  }

  addMany(breakdowns: CostBreakdown[]): void {
    for (const breakdown of breakdowns) {
      this.add(breakdown);
    }
  }

  getTotalCost(): number {
    return this.totalCost;
  }

  getPerModelCost(): Record<string, number> {
    return Object.fromEntries(this.perModelCost.entries());
  }

  getBreakdowns(): CostBreakdown[] {
    return [...this.breakdowns];
  }

  reset(): void {
    this.totalCost = 0;
    this.perModelCost.clear();
    this.breakdowns = [];
  }
}
