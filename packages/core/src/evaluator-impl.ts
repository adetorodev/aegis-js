import {
  Dataset,
  EvaluationCase,
  EvaluationResult,
  CaseResult,
  ILLMAdapter,
  Scorer,
  GenerateInput,
  AdapterError,
  RateLimitError,
} from './index.js';
import { PromisePool, calculateStdDeviation } from './utils.js';

/**
 * Error handling modes for evaluation
 */
export enum ErrorHandlingMode {
  /** Stop on first error */
  FailFast = 'fail-fast',
  /** Continue on error and collect errors */
  ContinueOnError = 'continue-on-error',
}

/**
 * Evaluator configuration
 */
export interface EvaluatorConfig {
  /** Error handling mode (default: continue-on-error) */
  errorHandling?: ErrorHandlingMode;
  /** Number of concurrent requests (default: 5) */
  concurrency?: number;
  /** Maximum retries per case (default: 3) */
  maxRetries?: number;
  /** Initial retry delay in ms (default: 1000) */
  retryDelayMs?: number;
  /** Pass threshold score (default: 0.8) */
  passThreshold?: number;
}

/**
 * Evaluator class for running LLM evaluations on datasets
 */
export class EvaluatorImpl {
  private errorHandling: ErrorHandlingMode;
  private concurrency: number;
  private maxRetries: number;
  private retryDelayMs: number;
  private passThreshold: number;

  constructor(
    private adapter: ILLMAdapter,
    private scorers: Scorer[],
    config: EvaluatorConfig = {}
  ) {
    this.errorHandling = config.errorHandling ?? ErrorHandlingMode.ContinueOnError;
    this.concurrency = config.concurrency ?? 5;
    this.maxRetries = config.maxRetries ?? 3;
    this.retryDelayMs = config.retryDelayMs ?? 1000;
    this.passThreshold = config.passThreshold ?? 0.8;

    if (this.scorers.length === 0) {
      throw new Error('EvaluatorImpl requires at least one scorer');
    }
  }

  /**
   * Run evaluation on a dataset
   */
  async evaluate(dataset: Dataset): Promise<EvaluationResult> {
    const caseResults: CaseResult[] = [];
    const errors: string[] = [];

    // Create promise pool for concurrent execution
    const pool = new PromisePool<CaseResult>(this.concurrency);

    // Create tasks for each case
    const tasks = dataset.cases.map((caseItem, index) => async () => {
      try {
        return await this.evaluateCase(caseItem, index);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);

        if (this.errorHandling === ErrorHandlingMode.FailFast) {
          throw error;
        }

        // Continue-on-error mode
        errors.push(`Case ${index}: ${errorMsg}`);

        // Return failed case result
        return {
          caseIndex: index,
          score: 0,
          latencyMs: 0,
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
          output: '',
          error: errorMsg,
        };
      }
    });

    // Execute all tasks
    const results = await pool.all(tasks);
    caseResults.push(...results);

    // Calculate aggregated metrics
    const scores = caseResults.filter((r) => !r.error).map((r) => r.score);
    const passedCases = caseResults.filter((r) => r.score >= this.passThreshold).length;
    const failedCases = caseResults.filter((r) => r.error).length;

    const metrics = {
      meanScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
      minScore: scores.length > 0 ? Math.min(...scores) : 0,
      maxScore: scores.length > 0 ? Math.max(...scores) : 0,
      stdDeviation: calculateStdDeviation(scores),
      totalCost: caseResults.reduce((sum, r) => sum + r.cost, 0),
      totalLatencyMs: caseResults.reduce((sum, r) => sum + r.latencyMs, 0),
      passedCases,
      failedCases,
    };

    return {
      cases: caseResults,
      metrics,
      timestamp: new Date().toISOString(),
      errors,
    };
  }

  /**
   * Evaluate a single case with retry logic
   */
  private async evaluateCase(caseItem: EvaluationCase, index: number): Promise<CaseResult> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        return await this.executeCaseOnce(caseItem, index);
      } catch (error) {
        lastError = error as Error;

        // Retry only on rate-limit errors
        if (error instanceof RateLimitError && attempt < this.maxRetries - 1) {
          const retryAfter = error.retryAfter ?? this.retryDelayMs * Math.pow(2, attempt);
          await this.delay(retryAfter);
          continue;
        }

        throw lastError;
      }
    }

    throw lastError || new Error('Failed after max retries');
  }

  /**
   * Execute a single case once
   */
  private async executeCaseOnce(caseItem: EvaluationCase, index: number): Promise<CaseResult> {
    try {
      // Generate output
      const generateInput: GenerateInput = {
        prompt: caseItem.input,
        model: 'default',
      };

      const output = await this.adapter.generate(generateInput);
      const latencyMs = output.latencyMs;

      // Score the output
      let totalScore = 0;
      for (const scorer of this.scorers) {
        totalScore += scorer.score(caseItem.expectedOutput, output.text);
      }
      const score = totalScore / this.scorers.length;

      // Calculate cost (placeholder - 0 for now, will be enhanced in Phase 5)
      const cost = 0;

      return {
        caseIndex: index,
        score,
        latencyMs,
        inputTokens: output.inputTokens,
        outputTokens: output.outputTokens,
        cost,
        output: output.text,
      };
    } catch (error) {
      if (error instanceof RateLimitError) {
        throw error;
      }

      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new AdapterError(
        `Failed to evaluate case ${index}: ${errorMsg}`,
        'EVALUATION_ERROR',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
