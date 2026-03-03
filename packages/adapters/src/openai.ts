import {
  ILLMAdapter,
  GenerateInput,
  GenerateOutput,
  RateLimitError,
  AdapterError,
} from '@aegis-monitor/core';
import { BaseAdapter, AdapterConfig } from './base.js';

/**
 * OpenAI Adapter for GPT models
 */
export class OpenAIAdapter extends BaseAdapter implements ILLMAdapter {
  constructor(private config: AdapterConfig) {
    super();
  }

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    return this.withRetry(async () => {
      // Lazy load OpenAI SDK to avoid dependency issues if not installed
      let OpenAI;
      try {
        OpenAI = (await import('openai')).default;
      } catch {
        throw new AdapterError(
          'OpenAI SDK not installed. Run: npm install openai',
          'MISSING_DEPENDENCY'
        );
      }

      const client = new OpenAI({
        apiKey: this.config.apiKey,
      });

      const [result, latencyMs] = await this.measureLatency(async () => {
        try {
          return await client.chat.completions.create({
            model: this.config.model || 'gpt-4',
            messages: [
              {
                role: 'user',
                content: input.prompt,
              },
            ],
            max_tokens: input.maxTokens,
            temperature: input.temperature,
          });
        } catch (error) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const err = error as any;

          // Handle rate limit errors
          if (
            err.status === 429 ||
            err.code === 'rate_limit_exceeded' ||
            err.message?.includes('rate limit')
          ) {
            const retryAfter = err.headers?.['retry-after'];
            throw new RateLimitError(
              'OpenAI rate limit exceeded',
              retryAfter ? parseInt(retryAfter, 10) * 1000 : undefined,
              err
            );
          }

          // Handle auth errors
          if (err.status === 401 || err.code === 'invalid_request_error') {
            throw new AdapterError('OpenAI authentication failed', 'AUTH_ERROR', err);
          }

          throw new AdapterError(`OpenAI API error: ${err.message}`, 'API_ERROR', err);
        }
      });

      const content = result.choices?.[0]?.message?.content;
      if (!content) {
        throw new AdapterError('No content in OpenAI response', 'INVALID_RESPONSE');
      }

      return {
        text: content,
        inputTokens: result.usage?.prompt_tokens || 0,
        outputTokens: result.usage?.completion_tokens || 0,
        latencyMs,
      };
    });
  }
}
