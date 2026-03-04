# Next.js Integration Example

Use Aegis Monitor in a server route or server action.

## Example API Route

Create `app/api/evaluate/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { DatasetLoader, Evaluator } from '@aegis-monitor/core';
import { MockAdapterFactory } from '@aegis-monitor/adapters';
import { ExactMatchScorer } from '@aegis-monitor/scorers';

export async function GET() {
  const loader = new DatasetLoader();
  const dataset = loader.loadFromObject({
    cases: [{ input: '2+2', expectedOutput: '4' }],
  });

  const evaluator = new Evaluator(
    MockAdapterFactory.withResponse('4'),
    [new ExactMatchScorer()]
  );

  const result = await evaluator.evaluate(dataset);
  return NextResponse.json(result.metrics);
}
```
