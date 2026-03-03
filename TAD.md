TECHNICAL ARCHITECTURE DOCUMENT (TAD)
3.1 Architecture Overview
Client App
   |
   | uses
   v
Aegis Monitor SDK
   ├── Adapter Layer
   ├── Evaluation Engine
   ├── Scoring Engine
   ├── Cost Engine
   ├── Regression Engine
   └── CLI Wrapper

Pure in-process execution.

No background services.

3.2 Package Structure (Monorepo)
packages/
  core/
  adapters/
  scorers/
  cost/
  regression/
  cli/
examples/
docs/
3.3 Core Modules
3.3.1 Core (@aegis/core)

Responsibilities:

Dataset execution

Aggregation

Orchestration

Exports:

Evaluator

BaselineManager

3.3.2 Adapters (@aegis/adapters)

Implements:

OpenAIAdapter

AnthropicAdapter

GoogleAdapter

All implement LLMAdapter interface.

3.3.3 Scorers (@aegis/scorers)

Contains:

exactMatch()

compositeScorer()

customScorer()

3.3.4 Cost (@aegis/cost)

Contains:

PricingRegistry

CostCalculator

3.3.5 Regression (@aegis/regression)

Contains:

RegressionAnalyzer

ThresholdValidator

3.3.6 CLI (@aegis/cli)

Wrapper over core.

No logic duplication.

3.4 Execution Flow

Load dataset

Execute adapter.generate()

Collect tokens + latency

Score output

Compute cost

Aggregate metrics

Compare to baseline

Return structured result

Exit process (if CLI mode)

3.5 Baseline Strategy

Store in:

.aegis/baseline.json

Format:

{
  "score": 0.91,
  "cost": 4.23,
  "latency": 132
}
3.6 Concurrency Strategy

Configurable parallelism

Promise pool

Avoid unbounded concurrency

Backoff support

3.7 Error Handling Strategy

Fail-fast mode

Continue-on-error mode

Structured error reporting

Adapter-specific error mapping

3.8 Extensibility Model

Plugin interfaces:

Custom Scorer

Custom Adapter

Custom Cost Model

Custom Baseline Storage

No inheritance-heavy architecture.

Prefer composition.

4. Strategic Positioning

Aegis Monitor JS is:

The Jest for LLM prompts

The ESLint for AI quality

The CI guardrail for LLM cost

It transforms prompt engineering from experimentation into engineering discipline.