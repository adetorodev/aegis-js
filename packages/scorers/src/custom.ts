import { Scorer } from '@aegis-monitor/core';

/**
 * Create a custom scorer from a user-provided function
 * @param fn Scoring function that takes (expected, actual) and returns a score (0-1)
 * @returns Scorer implementation wrapping the function
 */
export function createCustomScorer(fn: (expected: string, actual: string) => number): Scorer {
  return {
    score(expected: string, actual: string): number {
      try {
        const result = fn(expected, actual);
        // Ensure result is between 0 and 1
        return Math.max(0, Math.min(1, result));
      } catch (error) {
        console.warn('Custom scorer error:', error);
        return 0.0;
      }
    },
  };
}

/**
 * Create a scorer that checks if actual contains expected as substring
 */
export function createContainsScorerFactory(): Scorer {
  return {
    score(expected: string, actual: string): number {
      return actual.includes(expected) ? 1.0 : 0.0;
    },
  };
}

/**
 * Create a scorer that checks if actual starts with expected
 */
export function createStartsWithScorerFactory(): Scorer {
  return {
    score(expected: string, actual: string): number {
      return actual.startsWith(expected) ? 1.0 : 0.0;
    },
  };
}

/**
 * Create a scorer that checks if actual ends with expected
 */
export function createEndsWithScorerFactory(): Scorer {
  return {
    score(expected: string, actual: string): number {
      return actual.endsWith(expected) ? 1.0 : 0.0;
    },
  };
}
