import { Scorer } from '@aegis-monitor/core';

/**
 * ExactMatchScorer performs case-sensitive exact string matching
 * Returns 1.0 for exact match, 0.0 otherwise
 */
export class ExactMatchScorer implements Scorer {
  /**
   * Score based on exact string match
   * @param expected Expected output string
   * @param actual Actual output string
   * @returns 1.0 if strings match exactly, 0.0 otherwise
   */
  score(expected: string, actual: string): number {
    return expected === actual ? 1.0 : 0.0;
  }
}

/**
 * CaseInsensitiveExactMatchScorer performs case-insensitive exact string matching
 */
export class CaseInsensitiveExactMatchScorer implements Scorer {
  /**
   * Score based on case-insensitive exact string match
   * @param expected Expected output string
   * @param actual Actual output string
   * @returns 1.0 if strings match (case-insensitive), 0.0 otherwise
   */
  score(expected: string, actual: string): number {
    return expected.toLowerCase() === actual.toLowerCase() ? 1.0 : 0.0;
  }
}
