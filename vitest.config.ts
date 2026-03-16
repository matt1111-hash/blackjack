import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      all: true,
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'src/App.tsx',
        'src/components/Table/**/*.tsx',
        'src/components/UI/ActionButtons.tsx',
        'src/components/UI/ChipSelector.tsx',
        'src/components/UI/GameResult.tsx',
        'src/logic/**/*.ts',
        'src/store/**/*.ts',
      ],
      exclude: [
        'e2e/**',
        'src/**/*.test.ts',
        'src/**/*.test.tsx',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
      },
    },
  },
});
