/**
 * @aegis-ai/scorers
 * Scoring functions and composition for Aegis AI
 */

export interface Scorer {
  score(expected: string, actual: string): number;
}

// Placeholder exports - to be implemented in Phase 3
export class ExactMatchScorer implements Scorer {
  score(expected: string, actual: string): number {
    throw new Error('Not implemented');
  }
}

export class CompositeScorer implements Scorer {
  constructor(_scorers: Scorer[], _weights?: number[]) {
    throw new Error('Not implemented');
  }

  score(expected: string, actual: string): number {
    throw new Error('Not implemented');
  }
}
