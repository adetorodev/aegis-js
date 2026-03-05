import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';

const workspaceRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@aegis-monitor/core': `${workspaceRoot}packages/core/src/index.ts`,
      '@aegis-monitor/adapters': `${workspaceRoot}packages/adapters/src/index.ts`,
      '@aegis-monitor/scorers': `${workspaceRoot}packages/scorers/src/index.ts`,
      '@aegis-monitor/cost': `${workspaceRoot}packages/cost/src/index.ts`,
      '@aegis-monitor/regression': `${workspaceRoot}packages/regression/src/index.ts`,
      '@aegis-monitor/cli': `${workspaceRoot}packages/cli/src/index.ts`,
    },
  },
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'packages/*/tests/',
      ],
    },
  },
});
