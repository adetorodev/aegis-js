import { Scorer } from '@aegis-monitor/core';

/**
 * TokenSimilarityScorer measures semantic similarity using token overlap
 * Uses word-level tokenization and Jaccard similarity
 */
export class TokenSimilarityScorer implements Scorer {
  /**
   * Create a TokenSimilarityScorer
   * @param caseSensitive Whether to treat tokens as case-sensitive. Default: false
   */
  constructor(private caseSensitive = false) {}

  /**
   * Score based on token overlap (Jaccard similarity)
   * @param expected Expected output string
   * @param actual Actual output string
   * @returns Similarity score (0.0 = no overlap, 1.0 = identical tokens)
   */
  score(expected: string, actual: string): number {
    // Tokenize strings
    const expectedTokens = this.tokenize(expected);
    const actualTokens = this.tokenize(actual);

    // Handle empty cases
    if (expectedTokens.length === 0 && actualTokens.length === 0) {
      return 1.0;
    }
    if (expectedTokens.length === 0 || actualTokens.length === 0) {
      return 0.0;
    }

    // Calculate Jaccard similarity
    const expectedSet = new Set(expectedTokens);
    const actualSet = new Set(actualTokens);

    const intersection = new Set([...expectedSet].filter((token) => actualSet.has(token)));
    const union = new Set([...expectedSet, ...actualSet]);

    return intersection.size / union.size;
  }

  /**
   * Tokenize a string into words
   */
  private tokenize(text: string): string[] {
    const normalized = this.caseSensitive ? text : text.toLowerCase();
    // Split on whitespace and punctuation, filter empty tokens
    return normalized.split(/[\s\p{P}]+/u).filter((token) => token.length > 0);
  }
}

/**
 * SemanticSimilarityScorer provides semantic similarity measurement
 * This implementation uses token overlap with additional normalization
 */
export class SemanticSimilarityScorer implements Scorer {
  /**
   * Create a SemanticSimilarityScorer
   * @param minSimilarity Minimum required similarity (0-1). Default: 0.0
   */
  constructor(private minSimilarity = 0.0) {}

  /**
   * Score based on semantic similarity
   * @param expected Expected output string
   * @param actual Actual output string
   * @returns Semantic similarity score (0.0-1.0)
   */
  score(expected: string, actual: string): number {
    return this.computeSimilarity(expected, actual);
  }

  /**
   * Compute semantic similarity between two strings
   */
  private computeSimilarity(expected: string, actual: string): number {
    // Exact match
    if (expected === actual) {
      return 1.0;
    }

    // Case-insensitive match
    if (expected.toLowerCase() === actual.toLowerCase()) {
      return 0.99;
    }

    // Tokenize
    const expectedTokens = this.tokenizeAndNormalize(expected);
    const actualTokens = this.tokenizeAndNormalize(actual);

    if (expectedTokens.length === 0 && actualTokens.length === 0) {
      return 1.0;
    }
    if (expectedTokens.length === 0 || actualTokens.length === 0) {
      return 0.0;
    }

    // Calculate Jaccard similarity
    const expectedSet = new Set(expectedTokens);
    const actualSet = new Set(actualTokens);

    const intersection = [...expectedSet.values()].filter((item) => actualSet.has(item)).length;
    const union = expectedSet.size + actualSet.size - intersection;

    const similarity = intersection / union;

    // Apply minimum similarity threshold
    return similarity >= this.minSimilarity ? similarity : 0.0;
  }

  /**
   * Tokenize and normalize text for semantic comparison
   */
  private tokenizeAndNormalize(text: string): string[] {
    return text
      .toLowerCase()
      .split(/[\s\p{P}]+/u)
      .filter((token) => token.length > 0 && !this.isStopword(token));
  }

  /**
   * Check if a token is a common stopword
   */
  private isStopword(token: string): boolean {
    const stopwords = new Set([
      'a',
      'an',
      'and',
      'are',
      'as',
      'at',
      'be',
      'by',
      'for',
      'from',
      'has',
      'he',
      'in',
      'is',
      'it',
      'its',
      'of',
      'on',
      'or',
      'that',
      'the',
      'to',
      'was',
      'will',
      'with',
    ]);
    return stopwords.has(token);
  }
}
