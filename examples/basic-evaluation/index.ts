import { DatasetLoader, Evaluator } from '@aegis-monitor/core';
import { MockAdapterFactory } from '@aegis-monitor/adapters';
import { ExactMatchScorer } from '@aegis-monitor/scorers';

const loader = new DatasetLoader();
const dataset = loader.loadFromObject({
  cases: [
    { input: 'What is 2+2?', expectedOutput: '4' },
    { input: 'Capital of France', expectedOutput: 'Paris' },
  ],
});

const adapter = MockAdapterFactory.withGenerator((input) => {
  if (input.prompt.includes('2+2')) return '4';
  if (input.prompt.includes('France')) return 'Paris';
  return 'unknown';
});

const evaluator = new Evaluator(adapter, [new ExactMatchScorer()], { concurrency: 5 });
const result = await evaluator.evaluate(dataset);

process.stdout.write(`${JSON.stringify(result.metrics, null, 2)}\n`);
