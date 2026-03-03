/**
 * Scoring Engine
 *
 * @module @aegis-monitor/scorers
 * @description Provides scorer implementations for evaluating LLM outputs
 */

// Re-export Scorer from core
export { Scorer } from '@aegis-monitor/core';

// Export exact match scorers
export { ExactMatchScorer, CaseInsensitiveExactMatchScorer } from './scorers/exact.js';

// Export fuzzy match scorer
export { FuzzyMatchScorer } from './scorers/fuzzy.js';

// Export JSON scorers
export { JSONValidityScorer, JSONSchemaScorer } from './scorers/json.js';

// Export regex scorers
export { RegexScorer, RegexExtractorScorer } from './scorers/regex.js';

// Export semantic similarity scorers
export { TokenSimilarityScorer, SemanticSimilarityScorer } from './scorers/semantic.js';

// Export composite scorers
export {
  CompositeScorer,
  MultiScorer,
  type WeightedScorer,
  type ScorerResult,
} from './composite.js';

// Export custom scorer factories
export {
  createCustomScorer,
  createContainsScorerFactory,
  createStartsWithScorerFactory,
  createEndsWithScorerFactory,
} from './custom.js';
