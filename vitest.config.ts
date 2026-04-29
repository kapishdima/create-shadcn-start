import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.test.ts'],
          globals: true,
        },
      },
      {
        test: {
          name: 'components',
          include: ['tests/components/**/*.test.{ts,tsx}'],
          globals: true,
        },
      },
      {
        test: {
          name: 'e2e',
          include: ['tests/e2e/**/*.test.ts'],
          globals: true,
          testTimeout: 120000,
        },
      },
    ],
  },
})
