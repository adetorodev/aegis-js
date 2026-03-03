import { describe, it, expect } from 'vitest';
import {
  ExactMatchScorer,
  CaseInsensitiveExactMatchScorer,
  FuzzyMatchScorer,
  JSONValidityScorer,
  JSONSchemaScorer,
  RegexScorer,
  RegexExtractorScorer,
  TokenSimilarityScorer,
  SemanticSimilarityScorer,
  CompositeScorer,
  MultiScorer,
  createCustomScorer,
  createContainsScorerFactory,
  createStartsWithScorerFactory,
  createEndsWithScorerFactory,
} from '../src/index.js';

describe('Scoring Engine', () => {
  describe('ExactMatchScorer', () => {
    const scorer = new ExactMatchScorer();

    it('returns 1.0 for exact match', () => {
      expect(scorer.score('hello', 'hello')).toBe(1.0);
    });

    it('returns 0.0 for non-match', () => {
      expect(scorer.score('hello', 'world')).toBe(0.0);
    });

    it('is case-sensitive', () => {
      expect(scorer.score('Hello', 'hello')).toBe(0.0);
    });

    it('handles empty strings', () => {
      expect(scorer.score('', '')).toBe(1.0);
      expect(scorer.score('', 'text')).toBe(0.0);
    });
  });

  describe('CaseInsensitiveExactMatchScorer', () => {
    const scorer = new CaseInsensitiveExactMatchScorer();

    it('returns 1.0 for case-insensitive match', () => {
      expect(scorer.score('Hello', 'hello')).toBe(1.0);
      expect(scorer.score('HELLO', 'Hello')).toBe(1.0);
    });

    it('returns 0.0 for non-match', () => {
      expect(scorer.score('hello', 'world')).toBe(0.0);
    });
  });

  describe('FuzzyMatchScorer', () => {
    const scorer = new FuzzyMatchScorer();

    it('returns 1.0 for exact match', () => {
      expect(scorer.score('hello', 'hello')).toBe(1.0);
    });

    it('returns less than 1.0 for similar strings', () => {
      const score = scorer.score('hello', 'hallo');
      expect(score).toBeGreaterThan(0.0);
      expect(score).toBeLessThan(1.0);
    });

    it('handles completely different strings', () => {
      expect(scorer.score('abc', 'xyz')).toBe(0.0);
    });

    it('respects threshold parameter', () => {
      const strictScorer = new FuzzyMatchScorer(0.8);
      // "hello" vs "hello" should be 1.0, above threshold
      expect(strictScorer.score('hello', 'hello')).toBe(1.0);
      // Very similar but below threshold
      const score = strictScorer.score('abc', 'abcd');
      expect(score).toBeLessThan(0.8);
    });
  });

  describe('JSONValidityScorer', () => {
    const scorer = new JSONValidityScorer();

    it('returns 1.0 for valid JSON in non-strict mode', () => {
      expect(scorer.score('{"a": 1}', '{"b": 2}')).toBe(1.0);
      expect(scorer.score('[]', '[1, 2, 3]')).toBe(1.0);
    });

    it('returns 0.0 for invalid JSON', () => {
      expect(scorer.score('{}', 'not json')).toBe(0.0);
      expect(scorer.score('{}', '{')).toBe(0.0);
    });

    it('validates structure match in strict mode', () => {
      const strictScorer = new JSONValidityScorer(true);

      // Same structure, different values
      expect(strictScorer.score('{"a": 1}', '{"a": 2}')).toBe(1.0);

      // Different structure
      expect(strictScorer.score('{"a": 1}', '{"b": 1}')).toBe(0.0);

      // Array vs object
      expect(strictScorer.score('[]', '{}')).toBe(0.0);
    });
  });

  describe('JSONSchemaScorer', () => {
    const scorer = new JSONSchemaScorer();

    it('returns 1.0 for identical JSON', () => {
      expect(scorer.score('{"a":1}', '{"a":1}')).toBe(1.0);
    });

    it('returns 0.0 for different JSON', () => {
      expect(scorer.score('{"a":1}', '{"a":2}')).toBe(0.0);
    });

    it('handles whitespace differences', () => {
      expect(scorer.score('{"a": 1}', '{"a":1}')).toBe(1.0);
    });

    it('returns 0.0 for invalid JSON', () => {
      expect(scorer.score('{}', 'invalid')).toBe(0.0);
    });
  });

  describe('RegexScorer', () => {
    const scorer = new RegexScorer('^H.*o$');
    const emailScorer = new RegexScorer(/^[\w.-]+@[\w.-]+\.\w+$/i);

    it('returns 1.0 when pattern matches', () => {
      expect(scorer.score('', 'Hello')).toBe(1.0);
      expect(emailScorer.score('', 'test@example.com')).toBe(1.0);
    });

    it('returns 0.0 when pattern does not match', () => {
      expect(scorer.score('', 'Goodbye')).toBe(0.0);
      expect(emailScorer.score('', 'invalid-email')).toBe(0.0);
    });

    it('ignores expected value', () => {
      expect(scorer.score('anything', 'Hello')).toBe(1.0);
    });
  });

  describe('RegexExtractorScorer', () => {
    const scorer = new RegexExtractorScorer('value: (\\w+)');

    it('extracts and matches captured group', () => {
      expect(scorer.score('hello', 'value: hello world')).toBe(1.0);
    });

    it('returns 0.0 when pattern does not match', () => {
      expect(scorer.score('hello', 'no pattern here')).toBe(0.0);
    });

    it('returns 0.0 when captured group does not match', () => {
      expect(scorer.score('hello', 'value: world')).toBe(0.0);
    });
  });

  describe('TokenSimilarityScorer', () => {
    const scorer = new TokenSimilarityScorer();

    it('returns 1.0 for identical tokens', () => {
      expect(scorer.score('hello world', 'hello world')).toBe(1.0);
    });

    it('returns 0.0 for completely different tokens', () => {
      expect(scorer.score('hello', 'world')).toBe(0.0);
    });

    it('calculates Jaccard similarity for partial match', () => {
      const score = scorer.score('hello world', 'hello there');
      expect(score).toBeGreaterThan(0.0);
      expect(score).toBeLessThan(1.0);
    });

    it('handles punctuation', () => {
      const score = scorer.score('Hello, world!', 'hello world');
      expect(score).toBe(1.0);
    });
  });

  describe('SemanticSimilarityScorer', () => {
    const scorer = new SemanticSimilarityScorer();

    it('returns 1.0 for exact match', () => {
      expect(scorer.score('hello world', 'hello world')).toBe(1.0);
    });

    it('returns 0.99 for case-insensitive match', () => {
      expect(scorer.score('Hello World', 'hello world')).toBe(0.99);
    });

    it('filters stopwords in semantic comparison', () => {
      // "the cat" vs "cat" should have similar meaning
      const score = scorer.score('the cat', 'a cat');
      expect(score).toBeGreaterThan(0.0);
    });

    it('respects minimum similarity threshold', () => {
      const strictScorer = new SemanticSimilarityScorer(0.8);
      const lowScore = strictScorer.score('a', 'completely unrelated');
      expect(lowScore).toBe(0.0); // Below threshold
    });
  });

  describe('CompositeScorer', () => {
    it('combines multiple scorers with weights', () => {
      const exact = new ExactMatchScorer();
      const fuzzy = new FuzzyMatchScorer();

      const composite = new CompositeScorer([
        { scorer: exact, weight: 0.7 },
        { scorer: fuzzy, weight: 0.3 },
      ]);

      // Exact match: both score 1.0
      expect(composite.score('hello', 'hello')).toBe(1.0);

      // Non-match: exact 0.0, fuzzy slightly > 0, weighted average is small
      const nonMatchScore = composite.score('hello', 'world');
      expect(nonMatchScore).toBeGreaterThanOrEqual(0.0);
      expect(nonMatchScore).toBeLessThan(0.2);
    });

    it('uses equal weights as default', () => {
      const exact = new ExactMatchScorer();
      const fixed = createCustomScorer(() => 0.5);

      const composite = new CompositeScorer([
        { scorer: exact, weight: 1 },
        { scorer: fixed, weight: 1 },
      ]);

      // (1.0 * 1 + 0.5 * 1) / 2 = 0.75
      expect(composite.score('hello', 'hello')).toBe(0.75);
    });

    it('throws on empty scorers list', () => {
      expect(() => new CompositeScorer([])).toThrow();
    });

    it('throws on zero total weight', () => {
      expect(() => new CompositeScorer([{ scorer: new ExactMatchScorer(), weight: 0 }])).toThrow();
    });
  });

  describe('MultiScorer', () => {
    const scorers = new Map([
      ['exact', new ExactMatchScorer()],
      ['fuzzy', new FuzzyMatchScorer()],
      ['contains', createContainsScorerFactory()],
    ]);

    const multi = new MultiScorer(scorers);

    it('scores with all scorers', () => {
      const results = multi.scoreAll('hello', 'hello');
      expect(results).toHaveLength(3);
      expect(results[0].name).toBe('exact');
      expect(results[0].score).toBe(1.0);
    });

    it('calculates average score', () => {
      // "hello" in "hello world" = exact 0, fuzzy < 1, contains 1
      const avg = multi.averageScore('hello', 'hello world');
      expect(avg).toBeGreaterThan(0.0);
      expect(avg).toBeLessThan(1.0);
    });

    it('finds best score', () => {
      const best = multi.bestScore('hello', 'hello world');
      expect(best.name).toBe('contains');
      expect(best.score).toBe(1.0);
    });
  });

  describe('Custom Scorer Factories', () => {
    it('createCustomScorer wraps user function', () => {
      const scorer = createCustomScorer((expected, actual) => {
        return expected === actual ? 1 : 0;
      });

      expect(scorer.score('test', 'test')).toBe(1.0);
      expect(scorer.score('test', 'other')).toBe(0.0);
    });

    it('clamps custom scorer output to [0, 1]', () => {
      const scorer = createCustomScorer(() => 2.0);
      expect(scorer.score('', '')).toBe(1.0);

      const negativeScorer = createCustomScorer(() => -1.0);
      expect(negativeScorer.score('', '')).toBe(0.0);
    });

    it('createContainsScorerFactory checks substring', () => {
      const scorer = createContainsScorerFactory();
      expect(scorer.score('hello', 'hello world')).toBe(1.0);
      expect(scorer.score('hello', 'world')).toBe(0.0);
    });

    it('createStartsWithScorerFactory checks prefix', () => {
      const scorer = createStartsWithScorerFactory();
      expect(scorer.score('hello', 'hello world')).toBe(1.0);
      expect(scorer.score('world', 'hello world')).toBe(0.0);
    });

    it('createEndsWithScorerFactory checks suffix', () => {
      const scorer = createEndsWithScorerFactory();
      expect(scorer.score('world', 'hello world')).toBe(1.0);
      expect(scorer.score('hello', 'hello world')).toBe(0.0);
    });
  });

  describe('Edge cases', () => {
    it('handles empty strings consistently', () => {
      const exact = new ExactMatchScorer();
      const fuzzy = new FuzzyMatchScorer();

      expect(exact.score('', '')).toBe(1.0);
      expect(fuzzy.score('', '')).toBe(1.0);
    });

    it('handles very long strings', () => {
      const longString = 'a'.repeat(10000);
      const exact = new ExactMatchScorer();
      expect(exact.score(longString, longString)).toBe(1.0);
    });

    it('handles special characters', () => {
      const special = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const exact = new ExactMatchScorer();
      expect(exact.score(special, special)).toBe(1.0);
    });

    it('handles Unicode characters', () => {
      const unicode = '你好世界 🌍 Привет';
      const exact = new ExactMatchScorer();
      expect(exact.score(unicode, unicode)).toBe(1.0);
    });
  });
});
