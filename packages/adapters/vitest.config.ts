import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';

const packageRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@aegis-monitor/core': `${packageRoot}../core/src/index.ts`,
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
