# Provider Setup Guide

This guide shows how to configure OpenAI, Anthropic, and Google adapters.

## OpenAI

```typescript
import { OpenAIAdapter } from '@aegis-monitor/adapters';

const adapter = new OpenAIAdapter({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4o-mini',
});
```

Environment variable:

```bash
export OPENAI_API_KEY=...
```

## Anthropic

```typescript
import { AnthropicAdapter } from '@aegis-monitor/adapters';

const adapter = new AnthropicAdapter({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-3-5-sonnet-latest',
});
```

Environment variable:

```bash
export ANTHROPIC_API_KEY=...
```

## Google (Gemini)

```typescript
import { GoogleAdapter } from '@aegis-monitor/adapters';

const adapter = new GoogleAdapter({
  apiKey: process.env.GOOGLE_API_KEY!,
  model: 'gemini-1.5-pro',
});
```

Environment variable:

```bash
export GOOGLE_API_KEY=...
```

## CLI config example

```typescript
import type { CLIConfig } from '@aegis-monitor/cli';

const config: CLIConfig = {
  datasetPath: './dataset.json',
  adapter: {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o-mini',
  },
  scorers: ['exact', 'semantic'],
};

export default config;
```

## Troubleshooting

- Missing SDK package: install provider SDK dependency listed in `docs/INSTALLATION.md`.
- 401 errors: verify API key is loaded in shell/session.
- 429 errors: lower concurrency and retry later.
