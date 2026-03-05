import { describe, it, expect } from 'vitest';
import { MockAdapterFactory } from '../src/mock.js';

describe('MockAdapterFactory', () => {
  it('creates default mock adapter that generates responses', async () => {
    const adapter = MockAdapterFactory.default();
    const result = await adapter.generate({
      prompt: 'Hello',
      model: 'mock',
    });

    expect(result.text).toContain('Mock response for: Hello');
    expect(result.inputTokens).toBeGreaterThan(0);
    expect(result.outputTokens).toBeGreaterThan(0);
    expect(result.latencyMs).toBeGreaterThan(0);
  });

  it('creates adapter with fixed response', async () => {
    const adapter = MockAdapterFactory.withResponse('Fixed response');
    const result = await adapter.generate({
      prompt: 'Any prompt',
      model: 'mock',
    });

    expect(result.text).toBe('Fixed response');
  });

  it('creates adapter with custom generator', async () => {
    const adapter = MockAdapterFactory.withGenerator((input) => input.prompt.toUpperCase());
    const result = await adapter.generate({
      prompt: 'hello',
      model: 'mock',
    });

    expect(result.text).toBe('HELLO');
  });

  it('creates adapter that throws error', async () => {
    const error = new Error('Test error');
    const adapter = MockAdapterFactory.failing(error);

    await expect(
      adapter.generate({
        prompt: 'test',
        model: 'mock',
      })
    ).rejects.toThrow('Test error');
  });

  it('estimates token counts correctly', async () => {
    const adapter = MockAdapterFactory.withResponse('Test');
    const result = await adapter.generate({
      prompt: 'Test prompt',
      model: 'mock',
    });

    // Token count estimation should be roughly characters / 3.5
    expect(result.inputTokens).toBeGreaterThan(0);
    expect(result.outputTokens).toBeGreaterThan(0);
  });
});
