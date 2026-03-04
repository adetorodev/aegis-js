# Integration Tests

This directory contains comprehensive integration, performance, and compatibility tests for the Aegis Monitor SDK.

## Test Structure

### `/integration`
End-to-end integration tests that verify the complete workflow across all packages.

- **`full-workflow.test.ts`**: Complete workflow from dataset to baseline comparison
- **`multi-adapter.test.ts`**: Multi-adapter comparison and performance tracking
- **`regression-workflow.test.ts`**: Regression detection workflow tests

### `/performance`
Performance benchmarks to ensure the SDK meets performance targets.

- **`benchmarks.test.ts`**: Performance benchmarks (overhead, throughput, memory)
  - Target: <50ms overhead per request
  - Tests with 1000+ cases
  - Concurrency benefits
  - Memory efficiency

### `/compatibility`
Tests for module loading, Node.js compatibility, and interoperability.

- **`module-loading.test.ts`**: ESM/CJS compatibility and package interoperability
  - Module loading verification
  - Cross-package type compatibility
  - Node.js 18+ feature support

## Running Tests

### Run all integration tests
```bash
npm run test:integration
```

### Run specific test suites
```bash
# Integration tests only
npm run test:integration -- integration/

# Performance tests only
npm run test:integration -- performance/

# Compatibility tests only
npm run test:integration -- compatibility/
```

### Run with coverage
```bash
npm run test:integration -- --coverage
```

### Run in watch mode
```bash
npm run test:integration -- --watch
```

## Test Requirements

- Node.js 18+
- All workspace packages must be built before running tests
- Tests use mock adapters to avoid external API dependencies

## Build Before Testing

Ensure all packages are built:
```bash
npm run build
```

## Success Criteria

- All integration tests pass
- Performance overhead <50ms per request
- Successfully handles 1000+ cases
- ESM and CJS modules load correctly
- Node.js 18+ compatibility verified
