/**
 * @aegis-monitor/cli
 * CLI for Aegis Monitor LLM evaluation
 */

import { Command } from 'commander';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  DatasetLoader,
  Evaluator,
  type Dataset,
  type EvaluationResult,
  type ILLMAdapter,
  type Scorer,
} from '@aegis-monitor/core';
import {
  OpenAIAdapter,
  AnthropicAdapter,
  GoogleAdapter,
  MockAdapterFactory,
} from '@aegis-monitor/adapters';
import {
  ExactMatchScorer,
  CaseInsensitiveExactMatchScorer,
  FuzzyMatchScorer,
  JSONValidityScorer,
  JSONSchemaScorer,
  TokenSimilarityScorer,
  SemanticSimilarityScorer,
} from '@aegis-monitor/scorers';
import {
  CostCalculator,
  PricingRegistry,
  ThresholdValidator as CostThresholdValidator,
} from '@aegis-monitor/cost';
import {
  BaselineManager,
  RegressionAnalyzer,
  type RegressionThresholds,
} from '@aegis-monitor/regression';

export const program = new Command();

export interface CLIThresholds {
  cost?: {
    warnAbove?: number;
    failAbove?: number;
  };
  regression?: RegressionThresholds;
}

export interface CLIConfig {
  datasetPath: string;
  adapter: {
    provider: 'openai' | 'anthropic' | 'google' | 'mock';
    apiKey?: string;
    model?: string;
    mockResponse?: string;
  };
  scorers: string[];
  concurrency?: number;
  thresholds?: CLIThresholds;
  output?: {
    format?: 'human' | 'json';
  };
}

export interface CommandContext {
  cwd: string;
  stdout: (message: string) => void;
  stderr: (message: string) => void;
}

const DEFAULT_CONFIG_TEMPLATE = `import type { CLIConfig } from '@aegis-monitor/cli';

const config: CLIConfig = {
  datasetPath: './datasets/sample.json',
  adapter: {
    provider: 'mock',
    model: 'mock-model',
    mockResponse: 'sample response',
  },
  scorers: ['exact', 'fuzzy', 'semantic'],
  concurrency: 5,
  thresholds: {
    cost: {
      warnAbove: 1,
      failAbove: 2,
    },
    regression: {
      score: { absoluteDrop: 0.05, percentageDrop: 5 },
      cost: { absoluteDrop: 1, percentageDrop: 20 },
      latency: { absoluteDrop: 200, percentageDrop: 20 },
    },
  },
  output: {
    format: 'human',
  },
};

export default config;
`;

export function createDefaultContext(): CommandContext {
  return {
    cwd: process.cwd(),
    stdout: (message: string) => process.stdout.write(`${message}\n`),
    stderr: (message: string) => process.stderr.write(`${message}\n`),
  };
}

export async function loadCLIConfig(configPath: string, cwd = process.cwd()): Promise<CLIConfig> {
  const absolute = resolve(cwd, configPath);
  const ext = absolute.split('.').pop()?.toLowerCase();

  if (ext === 'json') {
    const raw = await readFile(absolute, 'utf-8');
    return JSON.parse(raw) as CLIConfig;
  }

  const loaded = await import(pathToFileURL(absolute).href);
  const config = loaded.default ?? loaded.config;
  if (!config) {
    throw new Error(`No default export found in config file: ${configPath}`);
  }
  return config as CLIConfig;
}

export function createAdapter(config: CLIConfig): ILLMAdapter {
  const { adapter } = config;
  const model = adapter.model ?? 'default';

  switch (adapter.provider) {
    case 'openai':
      if (!adapter.apiKey) throw new Error('OpenAI adapter requires apiKey');
      return new OpenAIAdapter({ apiKey: adapter.apiKey, model });
    case 'anthropic':
      if (!adapter.apiKey) throw new Error('Anthropic adapter requires apiKey');
      return new AnthropicAdapter({ apiKey: adapter.apiKey, model });
    case 'google':
      if (!adapter.apiKey) throw new Error('Google adapter requires apiKey');
      return new GoogleAdapter({ apiKey: adapter.apiKey, model });
    case 'mock':
      return adapter.mockResponse
        ? MockAdapterFactory.withResponse(adapter.mockResponse)
        : MockAdapterFactory.default();
    default:
      throw new Error(
        `Unsupported adapter provider: ${(adapter as { provider: string }).provider}`
      );
  }
}

export function createScorers(config: CLIConfig): Scorer[] {
  const scorers: Scorer[] = [];

  for (const scorerName of config.scorers) {
    switch (scorerName.toLowerCase()) {
      case 'exact':
        scorers.push(new ExactMatchScorer());
        break;
      case 'exact-insensitive':
        scorers.push(new CaseInsensitiveExactMatchScorer());
        break;
      case 'fuzzy':
        scorers.push(new FuzzyMatchScorer());
        break;
      case 'json':
        scorers.push(new JSONValidityScorer());
        break;
      case 'json-schema':
        scorers.push(new JSONSchemaScorer());
        break;
      case 'token':
        scorers.push(new TokenSimilarityScorer());
        break;
      case 'semantic':
        scorers.push(new SemanticSimilarityScorer());
        break;
      default:
        throw new Error(`Unsupported scorer: ${scorerName}`);
    }
  }

  if (scorers.length === 0) {
    throw new Error('At least one scorer must be configured');
  }

  return scorers;
}

export function applyCostToEvaluation(
  result: EvaluationResult,
  config: CLIConfig
): EvaluationResult {
  const registry = new PricingRegistry();
  const calculator = new CostCalculator(registry);
  const model = config.adapter.model ?? 'gpt-4';

  let totalCost = 0;
  const cases = result.cases.map((caseResult) => {
    const cost = caseResult.error
      ? 0
      : calculator.calculateCost(model, caseResult.inputTokens, caseResult.outputTokens);
    totalCost += cost;
    return {
      ...caseResult,
      cost,
    };
  });

  return {
    ...result,
    cases,
    metrics: {
      ...result.metrics,
      totalCost,
    },
  };
}

export function renderHumanResult(result: EvaluationResult): string {
  return [
    'Evaluation complete',
    `- Cases: ${result.cases.length}`,
    `- Mean score: ${result.metrics.meanScore.toFixed(4)}`,
    `- Min score: ${result.metrics.minScore.toFixed(4)}`,
    `- Max score: ${result.metrics.maxScore.toFixed(4)}`,
    `- Std dev: ${result.metrics.stdDeviation.toFixed(4)}`,
    `- Total cost: $${result.metrics.totalCost.toFixed(6)}`,
    `- Total latency: ${result.metrics.totalLatencyMs}ms`,
    `- Passed cases: ${result.metrics.passedCases}`,
    `- Failed cases: ${result.metrics.failedCases}`,
  ].join('\n');
}

export async function runEvaluationFromConfig(config: CLIConfig): Promise<EvaluationResult> {
  const datasetLoader = new DatasetLoader();
  const dataset = (await datasetLoader.loadFromFile(config.datasetPath)) as Dataset;
  const adapter = createAdapter(config);
  const scorers = createScorers(config);

  const evaluator = new Evaluator(adapter, scorers, {
    concurrency: config.concurrency ?? 5,
  });

  const rawResult = await evaluator.evaluate(dataset);
  return applyCostToEvaluation(rawResult, config);
}

export async function initCommand(
  options: { force?: boolean; cwd?: string } = {},
  ctx = createDefaultContext()
): Promise<number> {
  const cwd = options.cwd ?? ctx.cwd;
  const aegisDir = resolve(cwd, '.aegis');
  const configPath = resolve(cwd, 'aegis.config.ts');

  await mkdir(aegisDir, { recursive: true });

  if (existsSync(configPath) && !options.force) {
    ctx.stdout('Project already initialized. Use --force to overwrite config.');
    return 0;
  }

  await writeFile(configPath, DEFAULT_CONFIG_TEMPLATE, 'utf-8');
  ctx.stdout('Initialized Aegis Monitor project.');
  ctx.stdout(`Created: ${configPath}`);
  return 0;
}

export async function runCommand(
  options: { config?: string; json?: boolean; save?: boolean; cwd?: string } = {},
  ctx = createDefaultContext()
): Promise<number> {
  try {
    const configPath = options.config ?? 'aegis.config.ts';
    const config = await loadCLIConfig(configPath, options.cwd ?? ctx.cwd);
    const result = await runEvaluationFromConfig(config);

    if (config.thresholds?.cost) {
      const validator = new CostThresholdValidator();
      const budget = validator.validate(result.metrics.totalCost, config.thresholds.cost);
      if (budget.status === 'warn' && budget.message) {
        ctx.stderr(`Warning: ${budget.message}`);
      }
      if (budget.status === 'fail' && budget.message) {
        ctx.stderr(`Error: ${budget.message}`);
        return 1;
      }
    }

    if (options.save) {
      const baselineManager = new BaselineManager({ baseDir: options.cwd ?? ctx.cwd });
      await baselineManager.saveFromEvaluation(result, config.datasetPath);
      ctx.stdout('Baseline saved.');
    }

    if (options.json || config.output?.format === 'json') {
      ctx.stdout(JSON.stringify(result, null, 2));
    } else {
      ctx.stdout(renderHumanResult(result));
    }

    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ctx.stderr(`Run failed: ${message}`);
    return 2;
  }
}

export async function compareCommand(
  options: { config?: string; json?: boolean; cwd?: string } = {},
  ctx = createDefaultContext()
): Promise<number> {
  try {
    const configPath = options.config ?? 'aegis.config.ts';
    const config = await loadCLIConfig(configPath, options.cwd ?? ctx.cwd);

    const baselineManager = new BaselineManager({ baseDir: options.cwd ?? ctx.cwd });
    const baseline = await baselineManager.loadBaseline();

    if (!baseline) {
      ctx.stderr('No baseline found. Run `aegis-monitor baseline save` first.');
      return 2;
    }

    const result = await runEvaluationFromConfig(config);
    const analyzer = new RegressionAnalyzer();
    const report = analyzer.compare(
      baseline.metrics,
      {
        score: result.metrics.meanScore,
        cost: result.metrics.totalCost,
        latency: result.metrics.totalLatencyMs,
        stdDeviation: result.metrics.stdDeviation,
      },
      config.thresholds?.regression
    );

    if (options.json || config.output?.format === 'json') {
      ctx.stdout(JSON.stringify(report, null, 2));
    } else {
      ctx.stdout(`Comparison result: ${report.passed ? 'PASS' : 'FAIL'}`);
      ctx.stdout(
        `Score delta: ${report.score.delta.toFixed(6)} (${report.score.deltaPercent.toFixed(2)}%)`
      );
      ctx.stdout(
        `Cost delta: ${report.cost.delta.toFixed(6)} (${report.cost.deltaPercent.toFixed(2)}%)`
      );
      ctx.stdout(
        `Latency delta: ${report.latency.delta.toFixed(2)}ms (${report.latency.deltaPercent.toFixed(2)}%)`
      );
      if (!report.passed && report.failures.length > 0) {
        ctx.stdout('Failures:');
        for (const failure of report.failures) {
          ctx.stdout(`- ${failure}`);
        }
      }
    }

    return report.passed ? 0 : 1;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ctx.stderr(`Compare failed: ${message}`);
    return 2;
  }
}

export async function baselineSaveCommand(
  options: { config?: string; cwd?: string } = {},
  ctx = createDefaultContext()
): Promise<number> {
  try {
    const configPath = options.config ?? 'aegis.config.ts';
    const config = await loadCLIConfig(configPath, options.cwd ?? ctx.cwd);
    const result = await runEvaluationFromConfig(config);

    const baselineManager = new BaselineManager({ baseDir: options.cwd ?? ctx.cwd });
    await baselineManager.saveFromEvaluation(result, config.datasetPath);

    ctx.stdout('Baseline saved successfully.');
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ctx.stderr(`Baseline save failed: ${message}`);
    return 2;
  }
}

export function setupCLI(): void {
  program
    .name('aegis-monitor')
    .description('Aegis Monitor - LLM evaluation and governance')
    .version('0.0.1');

  program
    .command('init')
    .description('Initialize Aegis Monitor project')
    .option('--force', 'Overwrite existing config')
    .action(async (options) => {
      process.exitCode = await initCommand({ force: options.force });
    });

  program
    .command('run')
    .description('Run evaluation')
    .option('-c, --config <path>', 'Path to config file', 'aegis.config.ts')
    .option('--json', 'Output JSON format')
    .option('--save', 'Save baseline after run')
    .action(async (options) => {
      process.exitCode = await runCommand({
        config: options.config,
        json: options.json,
        save: options.save,
      });
    });

  program
    .command('compare')
    .description('Compare current run with baseline')
    .option('-c, --config <path>', 'Path to config file', 'aegis.config.ts')
    .option('--json', 'Output JSON format')
    .action(async (options) => {
      process.exitCode = await compareCommand({
        config: options.config,
        json: options.json,
      });
    });

  program
    .command('baseline')
    .command('save')
    .description('Save baseline')
    .option('-c, --config <path>', 'Path to config file', 'aegis.config.ts')
    .action(async (options) => {
      process.exitCode = await baselineSaveCommand({ config: options.config });
    });
}
