# Aegis Monitor – Development Plan

## Overview
Comprehensive development roadmap for building a TypeScript-first, provider-agnostic LLM evaluation and governance SDK.

---

## Phase 1: Foundation & Project Setup ✅ COMPLETE

### 1.1 Repository & Monorepo Structure
- [x] Initialize monorepo (npm workspaces or pnpm)
- [x] Set up root package.json with shared dependencies
- [x] Configure TypeScript root tsconfig with path mappings
- [x] Set up ESLint, Prettier, and other dev tools
- [x] Create .gitignore with node_modules, dist, .aegis/
- [x] Initialize Git and establish branch strategy

**Packages to create:**
- [x] `packages/core` – Core evaluation orchestrator
- [x] `packages/adapters` – Provider adapter implementations
- [x] `packages/scorers` – Scoring functions
- [x] `packages/cost` – Pricing and cost calculation
- [x] `packages/regression` – Regression detection engine
- [x] `packages/cli` – Command-line interface

### 1.2 Build & Publish Infrastructure
- [x] Configure TypeScript compilation (ESM + CJS output)
- [x] Set up build scripts for each package
- [x] Configure package.json exports for tree-shaking
- [x] Set up release automation (versioning, publishing)
- [x] Create GitHub Actions workflows

### 1.3 Documentation Structure
- [x] Create `/docs` folder structure
- [x] API documentation template
- [x] Installation guide template
- [x] Examples directory setup

---

## Phase 2: Core Adapter Infrastructure ✅ COMPLETE

### 2.1 Define Adapter Interfaces
- [x] Create `ILLMAdapter` interface
  - [x] `generate(input: GenerateInput): Promise<GenerateOutput>`
  - [x] Input/output normalization
  - [x] Token tracking (inputTokens, outputTokens)
  - [x] Latency measurement
- [x] Create `GenerateInput` interface (prompt, model, params)
- [x] Create `GenerateOutput` interface (text, inputTokens, outputTokens, latencyMs)
- [x] Error handling standardization (AdapterError, RateLimitError classes)

### 2.2 OpenAI Adapter Implementation
- [x] Implement OpenAIAdapter with:
  - [x] API key configuration
  - [x] Model selection (gpt-4, gpt-3.5-turbo, etc.)
  - [x] Token counting
  - [x] Error mapping (429 rate limits, 401 auth, API errors)
- [x] Add retry logic with exponential backoff (3 retries, configurable)
- [x] Lazy SDK loading to avoid hard dependencies
- [x] Unit tests for request/response normalization

### 2.3 Anthropic Adapter Implementation
- [x] Implement AnthropicAdapter
- [x] Token counting with Claude models
- [x] Error handling for rate limits (rate_limit_error, authentication_error)
- [x] Content type validation

### 2.4 Google Adapter Implementation
- [x] Implement GoogleAdapter (Gemini)
- [x] Token counting with estimation (chars / 3.5)
- [x] Error handling (429, PERMISSION_DENIED)
- [x] Lazy SDK loading

### 2.5 Adapter Testing
- [x] Mock adapter factory for testing without API calls
- [x] Mock response generators (MockAdapter, FixedResponseAdapter, ErrorAdapter)
- [x] Comprehensive test suite (11 tests) covering:
  - [x] MockAdapterFactory methods (default, withResponse, withGenerator, failing)
  - [x] BaseAdapter retry logic
  - [x] Latency measurement
  - [x] Error handling (AdapterError, RateLimitError)

---

## Phase 3: Scoring Engine ✅ COMPLETE

### 3.1 Scorer Interface & Composition
- [x] Define `Scorer` interface:
  - [x] `score(expected: string, actual: string): number (0-1)`
- [x] Create `CompositeScorer` for combining multiple scorers
- [x] Support scorer weighting (weighted average)
- [x] Implement scorer library utilities (MultiScorer)

### 3.2 Built-in Scorers
- [x] **Exact Match Scorer** – Binary exact match detection
- [x] **Case-Insensitive Exact Match Scorer** – Case-insensitive exact matching
- [x] **Fuzzy Match Scorer** – Levenshtein distance with configurable threshold
- [x] **JSON Validity Scorer** – Validates JSON structure (strict/non-strict modes)
- [x] **JSON Schema Scorer** – Exact JSON equality matching
- [x] **Regex Scorer** – Pattern matching against output
- [x] **Regex Extractor Scorer** – Captures and validates extracted values
- [x] **Token Similarity Scorer** – Jaccard similarity using word tokens
- [x] **Semantic Similarity Scorer** – Token overlap with stopword filtering
- [x] **Custom Scorer** – User-provided function support via factories

### 3.3 Scoring Tests
- [x] Unit tests for each scorer (47 test cases)
- [x] Integration tests with real outputs
- [x] Edge case handling (empty strings, special characters, Unicode)

---

## Phase 4: Dataset & Evaluation Engine ✅ COMPLETE

### 4.1 Dataset Structure
- [x] Define JSON dataset format:
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
- [x] Create dataset loader (`DatasetLoader.loadFromFile`, `loadFromObject`)
- [x] Validation for dataset structure (`validateDataset` + typed validation)
- [x] Support for fixture files (JSON dataset loading from disk)

### 4.2 Core Evaluator
- [x] Implement `Evaluator` class:
  - [x] Accept dataset
  - [x] Accept adapter
  - [x] Accept scorer(s)
  - [x] Execute cases (sequential and parallel modes)
- [x] Implement concurrency control:
  - [x] Promise pool with configurable concurrency
  - [x] Rate limit awareness
  - [x] Exponential backoff on rate-limit errors
- [x] Error handling modes:
  - [x] Fail-fast
  - [x] Continue-on-error with collection

### 4.3 Result Aggregation
- [x] Create `EvaluationResult` interface:
  - [x] Per-case results (score, latency, tokens, cost)
  - [x] Aggregated metrics (mean, min, max, std deviation)
  - [x] Errors and warnings
  - [x] Timestamp and metadata
- [x] Implement aggregation logic

### 4.4 Evaluator Tests
- [x] Mock dataset execution
- [x] Concurrency tests
- [x] Error handling tests
- [x] Aggregation correctness tests

---

## Phase 5: Cost Engine ✅ COMPLETE

### 5.1 Pricing Registry
- [x] Create `PricingRegistry` with:
  - [x] Per-model pricing (input/output token rates)
  - [x] Support for major providers (OpenAI, Anthropic, Google)
  - [x] Ability to override/extend pricing
- [x] Implement pricing data structure:
  ```json
  {
    "gpt-4": {
      "inputPrice": 0.00003,
      "outputPrice": 0.00006
    }
  }
  ```

### 5.2 Cost Calculator
- [x] Implement cost calculation:
  - [x] Per-request cost = (inputTokens × inputPrice) + (outputTokens × outputPrice)
  - [x] Aggregated cost per run
  - [x] Cost with margin/markup support
- [x] Add currency support

### 5.3 Cost Validation
- [x] Threshold validation (warn/fail if over budget)
- [x] Cost per-case breakdown
- [x] Cumulative cost tracking

### 5.4 Cost Tests
- [x] Unit tests for pricing calculation
- [x] Integration tests with real token counts

---

## Phase 6: Regression Engine ✅ COMPLETE

### 6.1 Baseline Management
- [x] `BaselineManager` implementation:
  - [x] Save baseline to `.aegis/baseline.json`
  - [x] Load baseline from file
  - [x] Create/update baseline from evaluation run
  - [x] Version baseline metadata (`version` field)

### 6.2 Baseline Storage Format
- [x] Define baseline JSON schema:
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
- [x] `RegressionAnalyzer` implementation:
  - [x] Compare current run vs baseline
  - [x] Calculate deltas (absolute and percentage)
  - [x] Detect regressions
- [x] `ThresholdValidator`:
  - [x] Configurable thresholds per metric
  - [x] Threshold strategies (percentage drop, absolute drop)

### 6.4 Regression Reporting
- [x] Structured regression report:
  - [x] Metric-by-metric comparison
  - [x] Pass/fail status
  - [x] CI-friendly output format (`passed` + `failures` fields)

### 6.5 Regression Tests
- [x] Baseline save/load tests
- [x] Regression detection tests
- [x] Threshold validation tests

---

## Phase 7: CLI Implementation ✅ COMPLETE

### 7.1 CLI Command Structure
- [x] **`aegis init`** – Initialize project
  - [x] Create `.aegis/` directory
  - [x] Create default `aegis.config.ts`
- [x] **`aegis run`** – Execute evaluation
  - [x] Load dataset
  - [x] Load adapter config
  - [x] Run evaluation
  - [x] Display results
  - [x] Save baseline (if --save flag)
- [x] **`aegis compare`** – Compare runs
  - [x] Compare current vs baseline
  - [x] Show regression report
  - [x] Exit with status code
- [x] **`aegis baseline save`** – Manually save baseline
  - [x] Save current run as baseline

### 7.2 CLI Configuration
- [x] `aegis.config.ts` (or .js/.json) schema:
  - [x] Dataset path
  - [x] Adapter configuration
  - [x] Scorers configuration
  - [x] Concurrency settings
  - [x] Threshold settings

### 7.3 CLI Output Formatting
- [x] Human-readable output
- [x] JSON output mode (for CI parsing)
- [x] Structured summary formatting for results
- [x] Pass/fail status output for compare workflow

### 7.4 CLI Error Handling
- [x] Graceful error messages
- [x] Exit codes (0 = success, 1 = failure, 2 = error)
- [x] Async command error capture in CLI entrypoint

### 7.5 CLI Tests
- [x] Command execution tests
- [x] Config loading tests
- [x] Output/exit-path tests

---

## Phase 8: Integration & Cross-Package Testing ✅ COMPLETE

### 8.1 End-to-End Tests
- [x] Full workflow: dataset → adapter → scorer → cost → baseline
- [x] Multi-adapter comparison
- [x] Regression detection workflow
- [x] CLI integration tests

### 8.2 Performance Testing
- [x] Measure overhead per request (target: <50ms)
- [x] Test with 10k+ cases
- [x] Memory profiling

### 8.3 Compatibility Testing
- [x] Node.js 18+ compatibility
- [x] Edge runtime compatibility (Vercel, Cloudflare)
- [x] ESM and CJS module loading
- [x] Tree-shaking verification

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
