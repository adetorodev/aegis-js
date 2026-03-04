# CI/CD Integration Guide

Use Aegis Monitor in CI to block regressions and budget overruns.

## Minimal workflow

```yaml
name: Aegis Eval

on:
  pull_request:
  push:
    branches: [main]

jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - run: npx aegis-monitor run --config aegis.config.ts
      - run: npx aegis-monitor compare --config aegis.config.ts
```

## Recommended CI sequence

1. `aegis-monitor run` to evaluate a dataset.
2. `aegis-monitor baseline save` on main after approved changes.
3. `aegis-monitor compare` in PR CI to detect regressions.

## JSON output for machine parsing

```bash
npx aegis-monitor compare --config aegis.config.ts --json
```

## Exit codes

- `0`: success
- `1`: threshold/regression failure
- `2`: runtime/configuration error

## Baseline storage

Baselines are stored in `.aegis/baseline.json` by default. Commit policy depends on your team:

- Commit baseline file for deterministic comparisons, or
- Store baseline as CI artifact if you prefer ephemeral baselines.
