import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: ['packages/*', 'apps/*'],
    coverage: { provider: 'v8', include: ['packages/*/src/**'] },
  },
});
