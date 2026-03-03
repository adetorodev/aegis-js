# API Reference Structure

This directory contains API documentation for all Aegis packages.

## Packages

- [Core](./core.md) - Main evaluation orchestrator
- [Adapters](./adapters.md) - LLM provider integrations
- [Scorers](./scorers.md) - Evaluation scoring functions
- [Cost](./cost.md) - Cost calculation and tracking
- [Regression](./regression.md) - Regression detection and baselines
- [CLI](./cli.md) - Command-line interface

## Key Interfaces

### LLMAdapter

```typescript
interface LLMAdapter {
  generate(input: GenerateInput): Promise<GenerateOutput>;
}
```

### Scorer

```typescript
interface Scorer {
  score(expected: string, actual: string): number;
}
```

### EvaluationResult

```typescript
interface EvaluationResult {
  cases: CaseResult[];
  metrics: AggregatedMetrics;
  timestamp: string;
  errors: string[];
}
```

See individual package documentation for detailed API reference.
