import { Scorer } from '@aegis-monitor/core';

/**
 * RegexScorer validates that output matches a regex pattern
 */
export class RegexScorer implements Scorer {
  private pattern: RegExp;

  /**
   * Create a RegexScorer
   * @param pattern Regex pattern to match against (string or RegExp)
   * @param flags Optional regex flags (e.g., 'i' for case-insensitive)
   */
  constructor(pattern: string | RegExp, flags?: string) {
    if (typeof pattern === 'string') {
      this.pattern = new RegExp(pattern, flags);
    } else {
      this.pattern = pattern;
    }
  }

  /**
   * Score based on regex pattern match
   * Returns 1.0 if pattern matches, 0.0 otherwise
   * @param _expected Expected output (not used for regex matching)
   * @param actual Actual output string
   * @returns 1.0 if pattern matches, 0.0 otherwise
   */
  score(_expected: string, actual: string): number {
    return this.pattern.test(actual) ? 1.0 : 0.0;
  }
}

/**
 * RegexExtractorScorer validates that output can extract a substring matching a pattern
 */
export class RegexExtractorScorer implements Scorer {
  private pattern: RegExp;

  /**
   * Create a RegexExtractorScorer
   * @param pattern Regex pattern with optional capture group
   * @param flags Optional regex flags
   */
  constructor(pattern: string | RegExp, flags?: string) {
    if (typeof pattern === 'string') {
      this.pattern = new RegExp(pattern, flags);
    } else {
      this.pattern = pattern;
    }
  }

  /**
   * Score based on match extraction
   * @param expected Expected value that should be extractable
   * @param actual Actual output string
   * @returns 1.0 if expected can be extracted from actual, 0.0 otherwise
   */
  score(expected: string, actual: string): number {
    const match = actual.match(this.pattern);
    if (!match) {
      return 0.0;
    }

    // If there's a capture group, check its value
    if (match[1] !== undefined) {
      return match[1] === expected ? 1.0 : 0.0;
    }

    // Otherwise, check if full match contains expected
    return match[0].includes(expected) ? 1.0 : 0.0;
  }
}
