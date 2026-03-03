import {
  ILLMAdapter,
  GenerateInput,
  GenerateOutput,
  RateLimitError,
  AdapterError,
} from '@aegis-monitor/core';
import { BaseAdapter, AdapterConfig } from './base.js';

/**
 * Google Adapter for Gemini models
 */
export class GoogleAdapter extends BaseAdapter implements ILLMAdapter {
  constructor(private config: AdapterConfig) {
    super();
  }

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    return this.withRetry(async () => {
      // Lazy load Google SDK
      let genai;
      try {
        genai = await import('@google/generative-ai');
      } catch {
        throw new AdapterError(
          'Google Generative AI SDK not installed. Run: npm install @google/generative-ai',
          'MISSING_DEPENDENCY'
        );
      }

      const GoogleGenerativeAI = genai.GoogleGenerativeAI;
      const client = new GoogleGenerativeAI(this.config.apiKey);
      const model = client.getGenerativeModel({
        model: this.config.model || 'gemini-pro',
      });

      const [result, latencyMs] = await this.measureLatency(async () => {
        try {
          return await model.generateContent({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: input.prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              maxOutputTokens: input.maxTokens,
              temperature: input.temperature,
            },
          });
        } catch (error) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const err = error as any;

          // Handle rate limit errors
          if (
            err.status === 429 ||
            err.message?.includes('rate limit') ||
            err.message?.includes('too_many_requests')
          ) {
            throw new RateLimitError('Google rate limit exceeded', undefined, err);
          }

          // Handle auth errors
          if (err.status === 401 || err.message?.includes('PERMISSION_DENIED')) {
            throw new AdapterError('Google authentication failed', 'AUTH_ERROR', err);
          }

          throw new AdapterError(`Google API error: ${err.message}`, 'API_ERROR', err);
        }
      });

      const text = result.response.text();
      if (!text) {
        throw new AdapterError('No text content in Google response', 'INVALID_RESPONSE');
      }

      // Google doesn't return token counts in the standard response
      // Use a rough estimation based on character count
      const estimatedInputTokens = Math.ceil(input.prompt.length / 3.5);
      const estimatedOutputTokens = Math.ceil(text.length / 3.5);

      return {
        text,
        inputTokens: estimatedInputTokens,
        outputTokens: estimatedOutputTokens,
        latencyMs,
      };
    });
  }
}
