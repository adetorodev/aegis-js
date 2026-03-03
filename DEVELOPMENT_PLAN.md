# Aegis monitor – Development Plan

## Overview
Comprehensive development roadmap for building a TypeScript-first, provider-agnostic LLM evaluation and governance SDK.

---

## Phase 1: Foundation & Project Setup

### 1.1 Repository & Monorepo Structure
- [ ] Initialize monorepo (npm workspaces or pnpm)
- [ ] Set up root package.json with shared dependencies
- [ ] Configure TypeScript root tsconfig with path mappings
- [ ] Set up ESLint, Prettier, and other dev tools
- [ ] Create .gitignore with node_modules, dist, .aegis/
- [ ] Initialize Git and establish branch strategy

**Packages to create:**
- [ ] `packages/core` – Core evaluation orchestrator
- [ ] `packages/adapters` – Provider adapter implementations
- [ ] `packages/scorers` – Scoring functions
- [ ] `packages/cost` – Pricing and cost calculation
- [ ] `packages/regression` – Regression detection engine
- [ ] `packages/cli` – Command-line interface

### 1.2 Build & Publish Infrastructure
- [ ] Configure TypeScript compilation (ESM + CJS output)
- [ ] Set up build scripts for each package
- [ ] Configure package.json exports for tree-shaking
- [ ] Set up release automation (versioning, publishing)
- [ ] Create GitHub Actions workflows

### 1.3 Documentation Structure
- [ ] Create `/docs` folder structure
- [ ] API documentation template
- [ ] Installation guide template
- [ ] Examples directory setup

---

## Phase 2: Core Adapter Infrastructure

### 2.1 Define Adapter Interfaces
- [ ] Create `LLMAdapter` interface
  - `generate(input: GenerateInput): Promise<GenerateOutput>`
  - Input/output normalization
  - Token tracking (inputTokens, outputTokens)
  - Latency measurement
- [ ] Create `GenerateInput` interface (prompt, model, params)
- [ ] Create `GenerateOutput` interface (text, inputTokens, outputTokens, latencyMs)
- [ ] Error handling standardization

### 2.2 OpenAI Adapter Implementation
- [ ] Implement OpenAIAdapter with:
  - API key configuration
  - Model selection (gpt-4, gpt-3.5-turbo, etc.)
  - Token counting
  - Cost calculation integration
  - Error mapping
- [ ] Add retry logic with exponential backoff
- [ ] Support streaming and non-streaming modes
- [ ] Unit tests for request/response normalization

### 2.3 Anthropic Adapter Implementation
- [ ] Implement AnthropicAdapter
- [ ] Token counting with Claude models
- [ ] Cost calculation
- [ ] Error handling for rate limits

### 2.4 Google Adapter Implementation
- [ ] Implement GoogleAdapter (Gemini)
- [ ] Token counting
- [ ] Cost calculation
- [ ] Error handling

### 2.5 Adapter Testing
- [ ] Mock adapter factory for testing without API calls
- [ ] Mock response generators
- [ ] Adapter test suite (shared interface compliance)

---

## Phase 3: Scoring Engine

### 3.1 Scorer Interface & Composition
- [ ] Define `Scorer` interface:
  - `score(expected: string, actual: string): number (0-1)`
- [ ] Create `CompositeScorer` for combining multiple scorers
- [ ] Support scorer weighting
- [ ] Implement scorer library utilities

### 3.2 Built-in Scorers
- [ ] **Exact Match Scorer** – Binary match detection
- [ ] **Fuzzy Match Scorer** – Levenshtein distance
- [ ] **Semantic Similarity Scorer** – Embedding-based (optional: built-in or external)
- [ ] **JSON Validity Scorer** – Validates JSON output structure
- [ ] **Regex Scorer** – Pattern matching
- [ ] **Custom Scorer** – User-provided function support

### 3.3 Scoring Tests
- [ ] Unit tests for each scorer
- [ ] Integration tests with real outputs
- [ ] Edge case handling (empty strings, special characters)

---

## Phase 4: Dataset & Evaluation Engine

### 4.1 Dataset Structure
- [ ] Define JSON dataset format:
  ```json
  {
    "cases": [
      {
        "input": "...",
        "expectedOutput": "...",
        "metadata": {}
      }
    ]
  }
  ```
- [ ] Create dataset loader
- [ ] Validation for dataset structure
- [ ] Support for fixture files

### 4.2 Core Evaluator
- [ ] Implement `Evaluator` class:
  - Accept dataset
  - Accept adapter
  - Accept scorer(s)
  - Execute cases (sequential and parallel modes)
- [ ] Implement concurrency control:
  - Promise pool with configurable concurrency
  - Rate limit awareness
  - Exponential backoff on errors
- [ ] Error handling modes:
  - Fail-fast
  - Continue-on-error with collection

### 4.3 Result Aggregation
- [ ] Create `EvaluationResult` interface:
  - Per-case results (score, latency, tokens, cost)
  - Aggregated metrics (mean, min, max, std deviation)
  - Errors and warnings
  - Timestamp and metadata
- [ ] Implement aggregation logic

### 4.4 Evaluator Tests
- [ ] Mock dataset execution
- [ ] Concurrency tests
- [ ] Error handling tests
- [ ] Aggregation correctness tests

---

## Phase 5: Cost Engine

### 5.1 Pricing Registry
- [ ] Create `PricingRegistry` with:
  - Per-model pricing (input/output token rates)
  - Support for major providers (OpenAI, Anthropic, Google)
  - Ability to override/extend pricing
- [ ] Implement pricing data structure:
  ```json
  {
    "gpt-4": {
      "inputPrice": 0.00003,
      "outputPrice": 0.00006
    }
  }
  ```

### 5.2 Cost Calculator
- [ ] Implement cost calculation:
  - Per-request cost = (inputTokens × inputPrice) + (outputTokens × outputPrice)
  - Aggregated cost per run
  - Cost with margin/markup support
- [ ] Add currency support

### 5.3 Cost Validation
- [ ] Threshold validation (warn/fail if over budget)
- [ ] Cost per-case breakdown
- [ ] Cumulative cost tracking

### 5.4 Cost Tests
- [ ] Unit tests for pricing calculation
- [ ] Integration tests with real token counts

---

## Phase 6: Regression Engine

### 6.1 Baseline Management
- [ ] `BaselineManager` implementation:
  - Save baseline to `.aegis/baseline.json`
  - Load baseline from file
  - Create/update baseline from evaluation run
  - Version baseline snapshots (optional)

### 6.2 Baseline Storage Format
- [ ] Define baseline JSON schema:
  ```json
  {
    "version": "1.0.0",
    "timestamp": "2026-03-03T...",
    "dataset": "dataset_v2",
    "metrics": {
      "score": 0.91,
      "cost": 4.23,
      "latency": 132,
      "stdDeviation": 0.05
    }
  }
  ```

### 6.3 Regression Analyzer
- [ ] `RegressionAnalyzer` implementation:
  - Compare current run vs baseline
  - Calculate deltas (absolute and percentage)
  - Detect regressions
- [ ] `ThresholdValidator`:
  - Configurable thresholds per metric
  - Threshold strategies (percentage drop, absolute drop)

### 6.4 Regression Reporting
- [ ] Structured regression report:
  - Metric-by-metric comparison
  - Pass/fail status
  - CI-friendly output format

### 6.5 Regression Tests
- [ ] Baseline save/load tests
- [ ] Regression detection tests
- [ ] Threshold validation tests

---

## Phase 7: CLI Implementation

### 7.1 CLI Command Structure
- [ ] **`aegis init`** – Initialize project
  - Create `.aegis/` directory
  - Create default `aegis.config.ts`
- [ ] **`aegis run`** – Execute evaluation
  - Load dataset
  - Load adapter config
  - Run evaluation
  - Display results
  - Save baseline (if --save flag)
- [ ] **`aegis compare`** – Compare runs
  - Compare current vs baseline
  - Show regression report
  - Exit with status code
- [ ] **`aegis baseline save`** – Manually save baseline
  - Save current run as baseline

### 7.2 CLI Configuration
- [ ] `aegis.config.ts` (or .js) schema:
  - Dataset path
  - Adapter configuration
  - Scorers configuration
  - Concurrency settings
  - Threshold settings

### 7.3 CLI Output Formatting
- [ ] Human-readable output
- [ ] JSON output mode (for CI parsing)
- [ ] Table formatting for results
- [ ] Color-coded pass/fail indicators

### 7.4 CLI Error Handling
- [ ] Graceful error messages
- [ ] Exit codes (0 = success, 1 = failure, 2 = error)
- [ ] Stack traces in debug mode

### 7.5 CLI Tests
- [ ] Command execution tests
- [ ] Config loading tests
- [ ] Output formatting tests

---

## Phase 8: Integration & Cross-Package Testing

### 8.1 End-to-End Tests
- [ ] Full workflow: dataset → adapter → scorer → cost → baseline
- [ ] Multi-adapter comparison
- [ ] Regression detection workflow
- [ ] CLI integration tests

### 8.2 Performance Testing
- [ ] Measure overhead per request (target: <50ms)
- [ ] Test with 10k+ cases
- [ ] Memory profiling

### 8.3 Compatibility Testing
- [ ] Node.js 18+ compatibility
- [ ] Edge runtime compatibility (Vercel, Cloudflare)
- [ ] ESM and CJS module loading
- [ ] Tree-shaking verification

---

## Phase 9: Documentation & Examples

### 9.1 API Documentation
- [ ] TypeScript interface documentation
- [ ] JSDoc comments for all public APIs
- [ ] Generate API reference (TypeDoc)

### 9.2 User Guides
- [ ] Installation guide
- [ ] Quick start guide
- [ ] Provider setup (OpenAI, Anthropic, Google)
- [ ] Custom scorer guide
- [ ] Custom adapter guide
- [ ] CI/CD integration guide

### 9.3 Examples
- [ ] Basic evaluation example
- [ ] Multi-adapter comparison
- [ ] Custom scorer example
- [ ] GitHub Actions workflow example
- [ ] Next.js integration example

### 9.4 README & Quickstart
- [ ] Root README with feature overview
- [ ] Installation instructions
- [ ] Basic example
- [ ] Links to detailed docs

---

## Phase 10: Release Preparation

### 10.1 Quality Assurance
- [ ] Lint all code (ESLint)
- [ ] Format all code (Prettier)
- [ ] Run full test suite with coverage >80%
- [ ] Type checking (strict TypeScript)
- [ ] Security audit (dependencies)

### 10.2 Package Configuration
- [ ] Verify package.json exports for tree-shaking
- [ ] Verify package.json files include everything needed
- [ ] Verify types are included in distribution
- [ ] Test npm install in clean environment

### 10.3 Release Workflow
- [ ] Set up semantic versioning
- [ ] Create CHANGELOG
- [ ] Tag releases in Git
- [ ] Publish to npm
- [ ] Create GitHub releases

### 10.4 Post-Release
- [ ] Monitor for issues
- [ ] Respond to community feedback
- [ ] Plan minor/patch releases

---

## Dependencies & Tools

### Core Dependencies
- `typescript` ^5.0
- `zod` (for runtime validation, optional)
- Provider SDKs: `openai`, `@anthropic-ai/sdk`, `@google-ai/generativelanguage`

### Dev Dependencies
- `tsx` or `ts-node-esm` (for CLI)
- `vitest` or `jest` (testing)
- `typescript` (TypeScript)
- `eslint`, `prettier` (code quality)
- `typedoc` (documentation)

---

## Success Criteria

- [ ] All functional requirements met
- [ ] Test coverage >80%
- [ ] TypeScript strict mode passes
- [ ] <50ms overhead per request
- [ ] Supports Node 18+
- [ ] Published on npm
- [ ] Comprehensive documentation
- [ ] Example projects working
- [ ] CI/CD integration tested

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1 | 2-3 days | None |
| Phase 2 | 5-7 days | Phase 1 |
| Phase 3 | 3-4 days | Phase 2 |
| Phase 4 | 5-7 days | Phase 2, 3 |
| Phase 5 | 2-3 days | Phase 4 |
| Phase 6 | 3-4 days | Phase 4 |
| Phase 7 | 4-5 days | Phase 4, 5, 6 |
| Phase 8 | 3-4 days | Phase 2-7 |
| Phase 9 | 4-5 days | Phase 2-7 |
| Phase 10 | 2-3 days | Phase 2-9 |
| **Total** | **34-45 days** | |

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Provider API changes | Adapter abstraction insulates core from changes |
| Performance regression | Continuous benchmarking in CI |
| Type safety gaps | Strict TypeScript, runtime validation |
| Edge runtime issues | Early compatibility testing |
| Breaking changes | Semantic versioning, clear deprecation path |

---

## Next Steps

1. **Immediate:** Approve Phase 1 tasks
2. **Week 1:** Complete Phases 1-2
3. **Week 2:** Complete Phases 3-5
4. **Week 3:** Complete Phases 6-8
5. **Week 4:** Complete Phases 9-10
