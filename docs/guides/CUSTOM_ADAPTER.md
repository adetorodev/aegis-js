# Custom Adapter Guide

Learn how to create custom LLM adapters for providers not included in Aegis Monitor.

## Basic Adapter Implementation

```typescript
import { LLMAdapter, GenerateInput, GenerateOutput } from '@aegis-monitor/core';

class MyCustomAdapter implements LLMAdapter {
  constructor(private apiKey: string, private model: string) {}

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    const startTime = Date.now();

    // Make API call to your LLM provider
    const response = await this.callAPI(input);

    const latencyMs = Date.now() - startTime;

    return {
      text: response.content,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      latencyMs,
    };
  }

  private async callAPI(input: GenerateInput): Promise<APIResponse> {
    // Implementation specific to your provider
    throw new Error('Not implemented');
  }
}
```

## Error Handling

Your adapter should handle errors gracefully:

```typescript
async generate(input: GenerateInput): Promise<GenerateOutput> {
  try {
    // API call
  } catch (error) {
    if (error instanceof RateLimitError) {
      // Implement exponential backoff
      await backoff();
      return this.generate(input);
    }
    throw new AdapterError(`Failed to generate: ${error.message}`);
  }
}
```

## Token Counting

For accurate cost calculation, ensure you properly count tokens:

```typescript
// Use your provider's token counter or implement your own
private countTokens(text: string): number {
  return text.split(/\s+/).length; // Simplified approximation
}
```

See [API Reference](./api/adapters.md) for full LLMAdapter interface.
