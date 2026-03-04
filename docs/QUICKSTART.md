# Quick Start Guide

## 1) Install packages

```bash
npm install @aegis-monitor/core @aegis-monitor/adapters @aegis-monitor/scorers @aegis-monitor/cost @aegis-monitor/regression
```

## 2) Create a dataset

```json
{
  "cases": [
    { "input": "What is 2+2?", "expectedOutput": "4" },
    { "input": "Capital of France", "expectedOutput": "Paris" }
  ]
}
```

## 3) Run an evaluation in code

```typescript
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

const evaluator = new Evaluator(adapter, [new ExactMatchScorer()], {
  concurrency: 5,
});

const result = await evaluator.evaluate(dataset);
console.log(result.metrics);
```

## 4) CLI quick start

Create `aegis.config.ts`:

```typescript
import type { CLIConfig } from '@aegis-monitor/cli';

const config: CLIConfig = {
  datasetPath: './dataset.json',
  adapter: {
    provider: 'mock',
    model: 'gpt-4',
    mockResponse: '4',
  },
  scorers: ['exact'],
  concurrency: 5,
  output: { format: 'human' },
};

export default config;
```

Run:

```bash
npx aegis-monitor init
npx aegis-monitor run --config aegis.config.ts
npx aegis-monitor baseline save --config aegis.config.ts
npx aegis-monitor compare --config aegis.config.ts
```

See [API Reference](./api/README.md) and [Guides](./guides/) for detailed usage.
