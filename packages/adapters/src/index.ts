/**
 * @aegis-monitor/adapters
 * LLM provider adapters for Aegis Monitor
 */

// Core exports
export { BaseAdapter, AdapterConfig } from './base.js';

// Provider adapters
export { OpenAIAdapter } from './openai.js';
export { AnthropicAdapter } from './anthropic.js';
export { GoogleAdapter } from './google.js';

// Mock adapters for testing
export { MockAdapter, FixedResponseAdapter, ErrorAdapter, MockAdapterFactory } from './mock.js';
