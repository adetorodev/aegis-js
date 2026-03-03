# Installation

## Requirements

- Node.js 18.0 or later
- npm 8.0 or later

## Quick Start

```bash
npm install @aegis-ai/core @aegis-ai/adapters @aegis-ai/scorers
```

## Provider-Specific Installation

### OpenAI

```bash
npm install @aegis-ai/adapters openai
```

### Anthropic

```bash
npm install @aegis-ai/adapters @anthropic-ai/sdk
```

### Google

```bash
npm install @aegis-ai/adapters @google/generative-ai
```

## Full Installation

For the complete SDK including CLI:

```bash
npm install @aegis-ai/core @aegis-ai/adapters @aegis-ai/scorers @aegis-ai/cost @aegis-ai/regression @aegis-ai/cli
```

## Monorepo Development

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd aegis-js
npm install
npm run build
```

See [Contributing](../CONTRIBUTING.md) for development guidelines.
