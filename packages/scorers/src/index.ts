/**
 * @aegis-monitor/scorers
 * Scoring functions and composition for Aegis Monitor
 */

export interface Scorer {
  score(expected: string, actual: string): number;
}

// Placeholder exports - to be implemented in Phase 3
export class ExactMatchScorer implements Scorer {
  score(_expected: string, _actual: string): number {
    throw new Error('Not implemented');
  }
}

export class CompositeScorer implements Scorer {
  constructor(_scorers: Scorer[], _weights?: number[]) {
    throw new Error('Not implemented');
  }

  score(_expected: string, _actual: string): number {
    throw new Error('Not implemented');
  }
}
