# Quick Start Guide

## Basic Evaluation

```typescript
import { Evaluator } from '@aegis-ai/core';
import { OpenAIAdapter } from '@aegis-ai/adapters';
import { ExactMatchScorer } from '@aegis-ai/scorers';

// Load your dataset
const dataset = {
  cases: [
    {
      input: 'What is 2+2?',
      expectedOutput: '4',
    },
  ],
};

// Create adapter
const adapter = new OpenAIAdapter({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4',
});

// Create scorer
const scorer = new ExactMatchScorer();

// Run evaluation
const evaluator = new Evaluator(adapter, [scorer]);
const result = await evaluator.evaluate(dataset);

console.log(result.metrics);
```

## Configuration

Create `aegis.config.ts` in your project root:

```typescript
export const config = {
  datasetPath: './datasets/test.json',
  adapter: {
    type: 'openai',
    model: 'gpt-4',
  },
  scorers: ['exactMatch'],
  concurrency: 5,
  thresholds: {
    score: 0.9,
    cost: 10.0,
  },
};
```

## CLI Usage

```bash
# Initialize project
npx aegis init

# Run evaluation
npx aegis run

# Compare with baseline
npx aegis compare

# Save baseline
npx aegis baseline save
```

See [API Reference](./api/README.md) for detailed documentation.
