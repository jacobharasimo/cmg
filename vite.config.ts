import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
// vitest/config re-exports Vite's defineConfig with the `test` key typed.
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    /*
      The dev watcher only needs what the app is built from.

      Vite already ignores `.git`, `node_modules`, `test-results` and the build
      output. These are the rest of the tree that is not in the module graph but
      does churn: `coverage` and `playwright-report` are rewritten wholesale on
      every test run, and waking the watcher for thousands of files each time
      costs file descriptors and CPU for no reload anyone wants.

      `public` is deliberately absent from this list: it is served content, so
      whatever reload behaviour Vite gives it should stay Vite's decision.
    */
    watch: {
      ignored: [
        '**/coverage/**',
        '**/playwright-report/**',
        '**/e2e/**',
        '**/docs/**',
        '**/design/**',
        '**/*.tsbuildinfo',
      ],
    },
  },
  build: { outDir: 'dist', sourcemap: true },
  test: {
    // Two projects: the evaluation library needs no DOM, and saying so in the
    // config keeps that honest — a stray React import there fails the run.
    projects: [
      {
        extends: true,
        test: {
          name: 'lib',
          environment: 'node',
          // The DOM-free layers, named explicitly: a React import here is a
          // mistake, and running them on `node` is what catches it.
          include: ['src/{lib,utils}/**/__tests__/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'ui',
          environment: 'jsdom',
          setupFiles: './src/test/setup.ts',
          css: true,
          // Everything else. Defined as "not the lib project" rather than a
          // list of folders, so a new top-level folder is covered by default
          // instead of silently having no tests.
          include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
          exclude: ['src/{lib,utils}/**'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/test/**',
        'src/**/__tests__/**',
        'src/**/index.ts',
        'src/**/types.ts',
        'src/vite-env.d.ts',
      ],
    },
  }
})
