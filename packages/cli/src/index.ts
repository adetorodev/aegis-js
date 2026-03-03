/**
 * @aegis-ai/cli
 * CLI for Aegis AI LLM evaluation
 */

import { Command } from 'commander';

export const program = new Command();

export async function initCommand(): Promise<void> {
  throw new Error('Not implemented');
}

export async function runCommand(): Promise<void> {
  throw new Error('Not implemented');
}

export async function compareCommand(): Promise<void> {
  throw new Error('Not implemented');
}

export async function baselineSaveCommand(): Promise<void> {
  throw new Error('Not implemented');
}

export function setupCLI(): void {
  program
    .name('aegis')
    .description('Aegis AI - LLM evaluation and governance')
    .version('0.0.1');

  program
    .command('init')
    .description('Initialize Aegis project')
    .action(initCommand);

  program
    .command('run')
    .description('Run evaluation')
    .action(runCommand);

  program
    .command('compare')
    .description('Compare with baseline')
    .action(compareCommand);

  program
    .command('baseline')
    .command('save')
    .description('Save baseline')
    .action(baselineSaveCommand);
}

export interface CLIConfig {
  datasetPath: string;
  adapterConfig: Record<string, unknown>;
  scorers: string[];
  concurrency: number;
  thresholds: Record<string, number>;
}
