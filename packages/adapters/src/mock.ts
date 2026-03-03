import { ILLMAdapter, GenerateInput, GenerateOutput, AdapterError } from '@aegis-monitor/core';

/**
 * Mock adapter for testing without API calls
 */
export class MockAdapter implements ILLMAdapter {
  constructor(
    private responseGenerator: (input: GenerateInput) => string = (input) =>
      `Mock response for: ${input.prompt}`
  ) {}

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 10 + Math.random() * 40));

    const text = this.responseGenerator(input);

    return {
      text,
      inputTokens: Math.ceil(input.prompt.length / 3.5),
      outputTokens: Math.ceil(text.length / 3.5),
      latencyMs: 10 + Math.random() * 40,
    };
  }
}

/**
 * Mock adapter that returns a fixed response
 */
export class FixedResponseAdapter implements ILLMAdapter {
  constructor(private response: string) {}

  async generate(input: GenerateInput): Promise<GenerateOutput> {
    return {
      text: this.response,
      inputTokens: Math.ceil(input.prompt.length / 3.5),
      outputTokens: Math.ceil(this.response.length / 3.5),
      latencyMs: 5,
    };
  }
}

/**
 * Mock adapter that throws errors
 */
export class ErrorAdapter implements ILLMAdapter {
  constructor(private error: Error = new AdapterError('Mock adapter error', 'MOCK_ERROR')) {}

  async generate(_input: GenerateInput): Promise<GenerateOutput> {
    throw this.error;
  }
}

/**
 * Mock adapter factory for creating test fixtures
 */
export class MockAdapterFactory {
  /**
   * Create a mock adapter with custom response
   */
  static withResponse(response: string): ILLMAdapter {
    return new FixedResponseAdapter(response);
  }

  /**
   * Create a mock adapter with custom response generator
   */
  static withGenerator(generator: (input: GenerateInput) => string): ILLMAdapter {
    return new MockAdapter(generator);
  }

  /**
   * Create a mock adapter that fails
   */
  static failing(error?: Error): ILLMAdapter {
    return new ErrorAdapter(error);
  }

  /**
   * Create a default mock adapter
   */
  static default(): ILLMAdapter {
    return new MockAdapter();
  }
}
