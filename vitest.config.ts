import { defineConfig } from 'vitest/config';
import AllureReporter from 'allure-vitest/reporter';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    reporters: [
      'default',
      new AllureReporter({ resultsDir: 'allure-results' }),
    ],
    include: ['tests/unit/**/*.test.ts', 'tests/contract/**/*.test.ts', 'tests/api/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**/*.ts', 'src/api/**/*.ts'],
      exclude: ['src/api/server.ts'],
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 80,
        statements: 90,
      },
    },
  },
});
