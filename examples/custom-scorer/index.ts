import { DatasetLoader, Evaluator, type Scorer } from '@aegis-monitor/core';
import { MockAdapterFactory } from '@aegis-monitor/adapters';

class ContainsScorer implements Scorer {
  score(expected: string, actual: string): number {
    return actual.toLowerCase().includes(expected.toLowerCase()) ? 1 : 0;
  }
}

const loader = new DatasetLoader();
const dataset = loader.loadFromObject({
  cases: [
    { input: 'hello', expectedOutput: 'hello' },
    { input: 'goodbye', expectedOutput: 'bye' },
  ],
});

const adapter = MockAdapterFactory.withGenerator((input) => `response: ${input.prompt}`);
const evaluator = new Evaluator(adapter, [new ContainsScorer()]);
const result = await evaluator.evaluate(dataset);

process.stdout.write(`${JSON.stringify(result.metrics, null, 2)}\n`);
