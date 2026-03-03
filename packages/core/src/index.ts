/**
 * @aegis-monitor/core
 * Core evaluation orchestrator for Aegis Monitor
 */

/**
 * Error thrown when an adapter fails
 */
export class AdapterError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AdapterError';
    Object.setPrototypeOf(this, AdapterError.prototype);
  }
}

/**
 * Error thrown when a rate limit is encountered
 */
export class RateLimitError extends AdapterError {
  constructor(
    message: string,
    public retryAfter?: number,
    originalError?: Error
  ) {
    super(message, 'RATE_LIMIT', originalError);
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * Input for LLM generation
 */
export interface GenerateInput {
  /** The prompt to send to the model */
  prompt: string;
  /** The model identifier (e.g., "gpt-4", "claude-3-opus") */
  model: string;
  /** Maximum tokens to generate (optional) */
  maxTokens?: number;
  /** Sampling temperature 0-1 (optional) */
  temperature?: number;
  /** Additional provider-specific parameters */
  [key: string]: unknown;
}

/**
 * Output from LLM generation
 */
export interface GenerateOutput {
  /** Generated text response */
  text: string;
  /** Number of input tokens consumed */
  inputTokens: number;
  /** Number of output tokens generated */
  outputTokens: number;
  /** Latency in milliseconds */
  latencyMs: number;
}

/**
 * Interface that all LLM adapters must implement
 */
export interface ILLMAdapter {
  /**
   * Generate a response from the LLM
   * @param input The generation input
   * @returns The generation output
   * @throws AdapterError if the request fails
   * @throws RateLimitError if rate limited
   */
  generate(input: GenerateInput): Promise<GenerateOutput>;
}

/**
 * Evaluation case with expected output
 */
export interface EvaluationCase {
  /** Input prompt */
  input: string;
  /** Expected output */
  expectedOutput: string;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Dataset containing evaluation cases
 */
export interface Dataset {
  /** Array of evaluation cases */
  cases: EvaluationCase[];
  /** Optional dataset metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Result for a single evaluation case
 */
export interface CaseResult {
  /** Index of the case in the dataset */
  caseIndex: number;
  /** Score from 0-1 */
  score: number;
  /** Latency in milliseconds */
  latencyMs: number;
  /** Input tokens used */
  inputTokens: number;
  /** Output tokens generated */
  outputTokens: number;
  /** Cost in USD */
  cost: number;
  /** Generated output */
  output: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Aggregated evaluation results
 */
export interface EvaluationResult {
  /** Per-case results */
  cases: CaseResult[];
  /** Aggregated metrics */
  metrics: {
    /** Mean score across all cases */
    meanScore: number;
    /** Minimum score */
    minScore: number;
    /** Maximum score */
    maxScore: number;
    /** Standard deviation of scores */
    stdDeviation: number;
    /** Total cost in USD */
    totalCost: number;
    /** Total latency in milliseconds */
    totalLatencyMs: number;
    /** Number of passed cases */
    passedCases: number;
    /** Number of failed cases */
    failedCases: number;
  };
  /** ISO timestamp of evaluation */
  timestamp: string;
  /** Error messages from failed cases */
  errors: string[];
}

/**
 * Scorer interface for evaluating outputs
 */
export interface Scorer {
  /**
   * Score an output against expected output
   * @param expected The expected output
   * @param actual The actual output from the model
   * @returns Score from 0-1 where 1 is perfect
   */
  score(expected: string, actual: string): number;
}

/**
 * Main evaluator class for running evaluations
 */
export class Evaluator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private impl?: any;

  constructor(
    private adapter: ILLMAdapter,
    private scorers: Scorer[],
    private config?: import('./evaluator-impl.js').EvaluatorConfig
  ) {
    if (scorers.length === 0) {
      throw new Error('Evaluator requires at least one scorer');
    }
  }

  /**
   * Run evaluation on a dataset
   * @param dataset The dataset to evaluate
   * @returns Evaluation results
   */
  async evaluate(dataset: Dataset): Promise<EvaluationResult> {
    // Lazy load and instantiate implementation
    if (!this.impl) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { EvaluatorImpl } = await import('./evaluator-impl.js');
      this.impl = new EvaluatorImpl(this.adapter, this.scorers, this.config);
    }
    return this.impl.evaluate(dataset);
  }
}

/**
 * Manager for baseline metrics
 */
export class BaselineManager {
  /**
   * Save evaluation result as baseline
   */
  async saveBaseline(_result: EvaluationResult): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Load baseline from storage
   */
  async loadBaseline(): Promise<EvaluationResult | null> {
    throw new Error('Not implemented');
  }
}

// Export evaluator types and utilities
export type { EvaluatorConfig } from './evaluator-impl.js';
export { ErrorHandlingMode } from './evaluator-impl.js';
export { PromisePool, validateDataset, calculateStdDeviation } from './utils.js';
export { DatasetLoader } from './dataset.js';
