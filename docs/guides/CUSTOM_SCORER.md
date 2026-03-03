# Custom Scorer Guide

Learn how to create custom scoring functions for your evaluation needs.

## Basic Scorer Implementation

```typescript
import { Scorer } from '@aegis-ai/scorers';

class CustomScorer implements Scorer {
  score(expected: string, actual: string): number {
    // Return a score between 0 and 1
    // 1 = perfect match, 0 = complete mismatch
    return expected === actual ? 1 : 0;
  }
}
```

## Advanced Examples

### Semantic Similarity Scorer

```typescript
// Compare outputs semantically (requires embedding model)
class SemanticScorer implements Scorer {
  constructor(private embeddingModel: EmbeddingModel) {}

  score(expected: string, actual: string): number {
    const expectedEmbedding = this.embeddingModel.embed(expected);
    const actualEmbedding = this.embeddingModel.embed(actual);
    
    return this.cosineSimilarity(expectedEmbedding, actualEmbedding);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    // Implementation...
    return 0;
  }
}
```

### JSON Validation Scorer

```typescript
class JSONScorer implements Scorer {
  score(expected: string, actual: string): number {
    try {
      const expectedJSON = JSON.parse(expected);
      const actualJSON = JSON.parse(actual);
      
      return JSON.stringify(expectedJSON) === JSON.stringify(actualJSON) ? 1 : 0;
    } catch {
      return 0;
    }
  }
}
```

See [API Reference](./api/scorers.md) for full Scorer interface.
