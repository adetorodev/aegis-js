# API Reference

API documentation is generated with TypeDoc from public package entrypoints.

## Generate docs

```bash
npm run docs:api
```

Generated output is written to:

- `docs/api/reference/`

## Package entry points

- `@aegis-monitor/core`
- `@aegis-monitor/adapters`
- `@aegis-monitor/scorers`
- `@aegis-monitor/cost`
- `@aegis-monitor/regression`
- `@aegis-monitor/cli`

## Core types to start with

- `ILLMAdapter`
- `Scorer`
- `DatasetLoader`
- `Evaluator`
- `EvaluationResult`

See guides in [docs/guides](../guides/) for end-to-end integration patterns.
