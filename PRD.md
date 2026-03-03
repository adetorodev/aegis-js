PRODUCT REQUIREMENTS DOCUMENT (PRD)
2.1 Product Name

Aegis AI – JS/TS SDK

2.2 Product Scope

Library-only.

Includes:

Core SDK

Adapter interface

Built-in provider adapters

Scoring engine

Cost engine

Regression engine

CLI (optional but included)

Excludes:

Web UI

Hosted services

Database layer

Authentication layer

Web dashboards

2.3 Product Goals
Primary Goals

Standardize LLM evaluation in JS ecosystems

Enable reproducible benchmark runs

Provide cost-aware evaluation

Enforce regression thresholds

Integrate with CI/CD

2.4 User Stories
US-1: Prompt Evaluation

As a developer, I want to test my prompt against a dataset and receive a structured report.

US-2: Regression Detection

As a team lead, I want my CI pipeline to fail if quality drops.

US-3: Cost Tracking

As a product owner, I want to know how much a feature costs per evaluation run.

US-4: Model Comparison

As an AI engineer, I want to compare two providers under the same dataset.

2.5 Functional Requirements
FR1: Adapter Abstraction

Must provide a unified interface:

interface LLMAdapter {
  generate(input: GenerateInput): Promise<GenerateOutput>
}

Adapters must normalize:

text

inputTokens

outputTokens

latencyMs

FR2: Dataset Runner

Accept JSON dataset

Run tests sequentially or in parallel

Aggregate results

Return EvaluationResult

FR3: Scoring Engine

Must support:

Exact match

Custom scorer injection

Structured validation

Composite scoring

Scorers must follow:

interface Scorer {
  score(expected: string, actual: string): number
}
FR4: Cost Engine

Must:

Accept token counts

Use pricing registry

Calculate cost per request

Aggregate cost per run

Cost formula:

Cost =
(inputTokens × inputPrice) +
(outputTokens × outputPrice)

FR5: Regression Engine

Must:

Compare run vs baseline

Support configurable thresholds

Return structured regression report

Provide CI-friendly failure status

FR6: CLI

Commands:

aegis init

aegis run

aegis compare

aegis baseline save

CLI must exit with non-zero code on regression failure.

2.6 Non-Functional Requirements

100% TypeScript public API

Strict type safety

< 50ms overhead per request

Support ESM

Support CJS

No global state

Memory safe for 10k test cases

No telemetry

2.7 Constraints

No web interface

No database

File-based baseline storage

Must run in Node 18+

Must support edge environments