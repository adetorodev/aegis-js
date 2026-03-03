# Aegis AI – JavaScript/TypeScript SDK

> A TypeScript-first, provider-agnostic evaluation and governance library for Large Language Model (LLM) applications.

## Overview

Aegis AI enables JavaScript and TypeScript applications to:

- **Evaluate** prompts against datasets
- **Track** token usage and cost
- **Detect** quality regressions
- **Compare** models side-by-side
- **Enforce** evaluation thresholds in CI pipelines

With major provider support including **OpenAI**, **Anthropic**, and **Google**.

## Key Features

✨ **TypeScript-First** – 100% typed public API
🚀 **Provider-Agnostic** – Works with any LLM provider
📊 **Regression Detection** – Catch quality drops before production
💰 **Cost Tracking** – Understand the cost per evaluation
🔄 **CI/CD Integration** – Enforce thresholds in your pipeline
⚡ **Performance** – <50ms overhead per request
🎯 **Edge Compatible** – Runs on Node.js, Vercel, Cloudflare, etc.
🔒 **No Telemetry** – Complete privacy, runs 100% locally

## What It Is Not

This is a **pure SDK** – no dashboard, no hosted service, no telemetry.

## Installation

```bash
npm install @aegis-ai/core @aegis-ai/adapters @aegis-ai/scorers
```

[Full installation guide](./docs/INSTALLATION.md)

## Quick Start

```typescript
import { Evaluator } from '@aegis-ai/core';
import { OpenAIAdapter } from '@aegis-ai/adapters';
import { ExactMatchScorer } from '@aegis-ai/scorers';

const dataset = {
  cases: [
    { input: 'What is 2+2?', expectedOutput: '4' },
  ],
};

const adapter = new OpenAIAdapter({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4',
});

const evaluator = new Evaluator(adapter, [new ExactMatchScorer()]);
const result = await evaluator.evaluate(dataset);

console.log(result.metrics);
```

[Full quickstart guide](./docs/QUICKSTART.md)

## Documentation

- [Installation Guide](./docs/INSTALLATION.md)
- [Quick Start](./docs/QUICKSTART.md)
- [API Reference](./docs/api/)
- [Custom Scorers](./docs/guides/CUSTOM_SCORER.md)
- [Custom Adapters](./docs/guides/CUSTOM_ADAPTER.md)
- [Examples](./examples/)

## Architecture

```
Aegis SDK
├── Adapter Layer (OpenAI, Anthropic, Google)
├── Evaluation Engine
├── Scoring Engine
├── Cost Engine
├── Regression Engine
└── CLI Wrapper
```

## Development

```bash
# Clone repository
git clone <repo>
cd aegis-js

# Install and build
npm install
npm run build

# Run tests
npm run test

# Code quality
npm run lint
npm run format
npm run type-check
```

See [DEVELOPMENT_PLAN.md](./DEVELOPMENT_PLAN.md) for the implementation roadmap.

## Core Philosophy

> LLMs must be treated like production dependencies.
>
> If you wouldn't deploy untested code, you shouldn't deploy untested prompts.

## License

MIT

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

**Status**: Phase 1 – Foundation & Project Setup ✓ Complete

Next: Phase 2 – Core Adapter Infrastructure
