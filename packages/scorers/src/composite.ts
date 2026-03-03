import { Scorer } from '@aegis-monitor/core';

/**
 * Weighted scorer configuration
 */
export interface WeightedScorer {
  scorer: Scorer;
  weight: number;
}

/**
 * CompositeScorer combines multiple scorers with weighted averaging
 */
export class CompositeScorer implements Scorer {
  private scorers: Array<{ scorer: Scorer; weight: number }> = [];
  private totalWeight = 0;

  /**
   * Create a CompositeScorer
   * @param scorers Array of scorers and their weights
   */
  constructor(scorers: WeightedScorer[]) {
    if (scorers.length === 0) {
      throw new Error('CompositeScorer requires at least one scorer');
    }

    this.scorers = scorers.map((ws) => ({
      scorer: ws.scorer,
      weight: ws.weight,
    }));

    // Calculate total weight
    this.totalWeight = this.scorers.reduce((sum, ws) => sum + ws.weight, 0);

    if (this.totalWeight <= 0) {
      throw new Error('CompositeScorer total weight must be greater than 0');
    }
  }

  /**
   * Score using weighted average of all scorers
   * @param expected Expected output string
   * @param actual Actual output string
   * @returns Weighted average score (0.0-1.0)
   */
  score(expected: string, actual: string): number {
    let weightedSum = 0;

    for (const { scorer, weight } of this.scorers) {
      const score = scorer.score(expected, actual);
      weightedSum += score * weight;
    }

    return weightedSum / this.totalWeight;
  }
}

/**
 * MultiScorer applies multiple scorers and returns all results
 * Useful for detailed scoring analysis
 */
export interface ScorerResult {
  name: string;
  scorer: Scorer;
  score: number;
}

export class MultiScorer {
  private scorers: Map<string, Scorer>;

  /**
   * Create a MultiScorer
   * @param scorers Map of scorer names to scorer instances
   */
  constructor(scorers: Map<string, Scorer> | Record<string, Scorer>) {
    this.scorers = scorers instanceof Map ? scorers : new Map(Object.entries(scorers));
  }

  /**
   * Score using all scorers and return results
   * @param expected Expected output string
   * @param actual Actual output string
   * @returns Array of scorer results
   */
  scoreAll(expected: string, actual: string): ScorerResult[] {
    const results: ScorerResult[] = [];

    for (const [name, scorer] of this.scorers.entries()) {
      results.push({
        name,
        scorer,
        score: scorer.score(expected, actual),
      });
    }

    return results;
  }

  /**
   * Get average score across all scorers
   * @param expected Expected output string
   * @param actual Actual output string
   * @returns Average score across all scorers
   */
  averageScore(expected: string, actual: string): number {
    const results = this.scoreAll(expected, actual);
    if (results.length === 0) return 0;
    const sum = results.reduce((acc, r) => acc + r.score, 0);
    return sum / results.length;
  }

  /**
   * Get the scorer with the highest score
   * @param expected Expected output string
   * @param actual Actual output string
   * @returns Name and score of best-performing scorer
   */
  bestScore(expected: string, actual: string): { name: string; score: number } {
    const results = this.scoreAll(expected, actual);
    if (results.length === 0) {
      return { name: '', score: 0 };
    }
    const best = results.reduce((max, r) => (r.score > max.score ? r : max));
    return { name: best.name, score: best.score };
  }
}
