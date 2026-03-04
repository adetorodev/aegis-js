# Installation

## Requirements

- Node.js 18.0 or later
- npm 8.0 or later

## Quick Start

```bash
npm install @aegis-monitor/core @aegis-monitor/adapters @aegis-monitor/scorers
```

## Provider-Specific Installation

### OpenAI

```bash
npm install @aegis-monitor/adapters openai
```

### Anthropic

```bash
npm install @aegis-monitor/adapters @anthropic-ai/sdk
```

### Google

```bash
npm install @aegis-monitor/adapters @google/generative-ai
```

## Optional packages

Install only what you need:

```bash
# Cost tracking
npm install @aegis-monitor/cost

# Regression baselines + comparisons
npm install @aegis-monitor/regression

# CLI
npm install @aegis-monitor/cli
```

## Full Installation

For the complete SDK including CLI:

```bash
npm install @aegis-monitor/core @aegis-monitor/adapters @aegis-monitor/scorers @aegis-monitor/cost @aegis-monitor/regression @aegis-monitor/cli
```

## Monorepo Development

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd aegis-js
npm install
npm run build
```

## Validate install locally

```bash
npm run type-check
npm run test
```

## Generate API docs

```bash
npm run docs:api
```

See [Contributing](../CONTRIBUTING.md) for development guidelines.
