/**
 * @aegis-monitor/adapters
 * LLM provider adapters for Aegis Monitor
 */

export interface LLMAdapterConfig {
  apiKey: string;
  model: string;
}

// Placeholder exports - to be implemented in Phase 2
export class OpenAIAdapter {
  constructor(_config: LLMAdapterConfig) {
    throw new Error('Not implemented');
  }
}

export class AnthropicAdapter {
  constructor(_config: LLMAdapterConfig) {
    throw new Error('Not implemented');
  }
}

export class GoogleAdapter {
  constructor(_config: LLMAdapterConfig) {
    throw new Error('Not implemented');
  }
}
