import { DatasetLoader, Evaluator } from '@aegis-monitor/core';
import { MockAdapterFactory } from '@aegis-monitor/adapters';
import { ExactMatchScorer } from '@aegis-monitor/scorers';

const loader = new DatasetLoader();
const dataset = loader.loadFromObject({
  cases: [
    { input: 'q1', expectedOutput: 'a1' },
    { input: 'q2', expectedOutput: 'a2' },
    { input: 'q3', expectedOutput: 'a3' },
  ],
});

const strictAdapter = MockAdapterFactory.withGenerator((input) => input.prompt.replace('q', 'a'));
const weakerAdapter = MockAdapterFactory.withGenerator((input) =>
  input.prompt === 'q3' ? 'wrong' : input.prompt.replace('q', 'a')
);

const scorer = new ExactMatchScorer();
const [strictResult, weakerResult] = await Promise.all([
  new Evaluator(strictAdapter, [scorer]).evaluate(dataset),
  new Evaluator(weakerAdapter, [scorer]).evaluate(dataset),
]);

process.stdout.write(
  `${JSON.stringify(
    {
      strict: strictResult.metrics,
      weaker: weakerResult.metrics,
    },
    null,
    2
  )}\n`
);
