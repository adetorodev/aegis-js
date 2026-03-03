import { Scorer } from '@aegis-monitor/core';

/**
 * Calculate Levenshtein distance between two strings
 * Represents minimum number of single-character edits (insertions, deletions, substitutions)
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

/**
 * FuzzyMatchScorer uses Levenshtein distance to measure string similarity
 * Converts edit distance to similarity score (1.0 = identical, 0.0 = completely different)
 */
export class FuzzyMatchScorer implements Scorer {
  /**
   * Create a FuzzyMatchScorer
   * @param threshold Minimum similarity score (0-1) to consider as valid match. Default: 0.0
   */
  constructor(private threshold = 0.0) {}

  /**
   * Score based on Levenshtein distance
   * @param expected Expected output string
   * @param actual Actual output string
   * @returns Similarity score (0.0 = completely different, 1.0 = identical)
   */
  score(expected: string, actual: string): number {
    // Handle edge cases
    if (expected === actual) return 1.0;
    if (expected.length === 0 || actual.length === 0) {
      return expected.length === actual.length ? 1.0 : 0.0;
    }

    // Calculate Levenshtein distance
    const distance = levenshteinDistance(expected, actual);
    const maxLength = Math.max(expected.length, actual.length);

    // Convert distance to similarity (0 = identical, maxLength = completely different)
    const similarity = 1 - distance / maxLength;

    // Apply threshold
    return similarity >= this.threshold ? similarity : 0.0;
  }
}
