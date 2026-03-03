import {
  ILLMAdapter,
  GenerateInput,
  GenerateOutput,
  RateLimitError,
  AdapterError,
} from '@aegis-monitor/core';
import { BaseAdapter, AdapterConfig } from './base.js';

/**
 * Anthropic Adapter for Claude models
 */
export class AnthropicAdapter extends BaseAdapter implements ILLMAdapter {
  constructor(private config: AdapterConfig) {
    super();
  }

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    return this.withRetry(async () => {
      // Lazy load Anthropic SDK
      let Anthropic;
      try {
        Anthropic = (await import('@anthropic-ai/sdk')).default;
      } catch {
        throw new AdapterError(
          'Anthropic SDK not installed. Run: npm install @anthropic-ai/sdk',
          'MISSING_DEPENDENCY'
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const client = new (Anthropic as any)({
        apiKey: this.config.apiKey,
      });

      const [result, latencyMs] = await this.measureLatency(async () => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return await (client as any).messages.create({
            model: this.config.model || 'claude-3-opus-20240229',
            max_tokens: input.maxTokens || 1024,
            messages: [
              {
                role: 'user',
                content: input.prompt,
              },
            ],
            temperature: input.temperature as number,
          });
        } catch (error) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const err = error as any;

          // Handle rate limit errors
          if (
            err.status === 429 ||
            err.error?.type === 'rate_limit_error' ||
            err.message?.includes('rate limit')
          ) {
            throw new RateLimitError('Anthropic rate limit exceeded', undefined, err);
          }

          // Handle auth errors
          if (err.status === 401 || err.error?.type === 'authentication_error') {
            throw new AdapterError('Anthropic authentication failed', 'AUTH_ERROR', err);
          }

          throw new AdapterError(`Anthropic API error: ${err.message}`, 'API_ERROR', err);
        }
      });

      const content = result.content?.[0];
      if (!content || content.type !== 'text') {
        throw new AdapterError('No text content in Anthropic response', 'INVALID_RESPONSE');
      }

      return {
        text: content.text,
        inputTokens: result.usage?.input_tokens || 0,
        outputTokens: result.usage?.output_tokens || 0,
        latencyMs,
      };
    });
  }
}
