import { Scorer } from '@aegis-monitor/core';

/**
 * JSONValidityScorer validates that output is valid JSON
 * It can optionally validate structure matches the expected JSON
 */
export class JSONValidityScorer implements Scorer {
  /**
   * Create a JSONValidityScorer
   * @param strict If true, validates that actual JSON structure matches expected structure. Default: false
   */
  constructor(private strict = false) {}

  /**
   * Score based on JSON validity and structure
   * @param expected Expected JSON string
   * @param actual Actual JSON string
   * @returns 1.0 if valid/matching, 0.0 otherwise
   */
  score(expected: string, actual: string): number {
    // Try to parse actual as JSON
    let actualJson: unknown;
    try {
      actualJson = JSON.parse(actual);
    } catch {
      return 0.0; // Actual is not valid JSON
    }

    // If not strict mode, just validating JSON is enough
    if (!this.strict) {
      return 1.0;
    }

    // In strict mode, validate structure matches expected
    let expectedJson: unknown;
    try {
      expectedJson = JSON.parse(expected);
    } catch {
      // Expected is not valid JSON, can't compare structure
      return 0.0;
    }

    // Check if structures match
    return this.structuresMatch(expectedJson, actualJson) ? 1.0 : 0.0;
  }

  /**
   * Check if two JSON structures have the same shape
   * (same keys, same value types at each level)
   */
  private structuresMatch(expected: unknown, actual: unknown): boolean {
    // Check type match
    if (typeof expected !== typeof actual) {
      return false;
    }

    // Handle primitives
    if (typeof expected !== 'object' || expected === null) {
      return typeof actual === typeof expected;
    }

    // Handle arrays
    if (Array.isArray(expected) && Array.isArray(actual)) {
      if (expected.length === 0 && actual.length === 0) {
        return true;
      }
      if (expected.length === 0 || actual.length === 0) {
        return expected.length === actual.length;
      }
      // Check first element structure
      return this.structuresMatch(expected[0], actual[0]);
    }

    // Handle objects
    if (!Array.isArray(expected) && !Array.isArray(actual)) {
      const expectedKeys = Object.keys(expected as Record<string, unknown>).sort();
      const actualKeys = Object.keys(actual as Record<string, unknown>).sort();

      if (expectedKeys.length !== actualKeys.length) {
        return false;
      }

      for (let i = 0; i < expectedKeys.length; i++) {
        if (expectedKeys[i] !== actualKeys[i]) {
          return false;
        }
      }

      // Check all values match structure
      for (const key of expectedKeys) {
        const expectedVal = (expected as Record<string, unknown>)[key];
        const actualVal = (actual as Record<string, unknown>)[key];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!this.structuresMatch(expectedVal, actualVal)) {
          return false;
        }
      }

      return true;
    }

    return false;
  }
}

/**
 * JSONSchemaScorer validates that output matches expected JSON exactly
 */
export class JSONSchemaScorer implements Scorer {
  /**
   * Score based on exact JSON equality
   * @param expected Expected JSON string
   * @param actual Actual JSON string
   * @returns 1.0 if JSON objects are equal, 0.0 otherwise
   */
  score(expected: string, actual: string): number {
    try {
      const expectedJson = JSON.parse(expected);
      const actualJson = JSON.parse(actual);
      return JSON.stringify(expectedJson) === JSON.stringify(actualJson) ? 1.0 : 0.0;
    } catch {
      return 0.0;
    }
  }
}
