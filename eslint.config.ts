import js from '@eslint/js'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules', 'design', 'playwright-report', 'test-results'] },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: { react: { version: 'detect' } },
    plugins: { react, 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...react.configs.flat.recommended?.rules,
      ...react.configs.flat['jsx-runtime']?.rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/prop-types': 'off',

      // `any` is banned — see CLAUDE.md
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-ignore': true, 'ts-expect-error': 'allow-with-description' },
      ],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],

      /*
        No `console`, anywhere. It is a debugging aid that survives into
        production, where nothing is watching it — no dashboard, no alert, no
        error budget. `utils/reportError` is the sanctioned path: it dispatches
        to the platform, which is where an error-tracking SDK listens.
      */
      'no-console': 'error',
    },
  },

  {
    // Components and hooks are arrow consts — the React convention, and it
    // keeps a component from being referenced above its definition by
    // hoisting. Plain TypeScript modules (`lib`, `utils`, theme factories)
    // keep function declarations, where hoisting is useful and expected.
    files: ['**/*.tsx', 'src/hooks/**/*.ts'],
    ignores: ['**/__tests__/**', 'src/test/**'],
    rules: {
      'func-style': ['error', 'expression', { allowArrowFunctions: true }],
      // `func-style` does not see `export default function Foo() {}` — the
      // very form most components used — so that case is caught separately.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ExportDefaultDeclaration > FunctionDeclaration',
          message:
            'Define the component as an arrow const, then default-export it: `const Foo = () => …; export default Foo`.',
        },
        {
          selector: 'JSXOpeningElement[name.name=/^(Button|IconButton)$/] > JSXAttribute[name.name="disabled"]',
          message:
            'A disabled button leaves the tab order, so nobody can reach it to find out what would enable it. State the condition beside the control instead.',
        },
      ],
    },
  },

  {
    files: ['**/__tests__/**', 'src/test/**'],
    languageOptions: { globals: globals.vitest },
    rules: {
      'react-refresh/only-export-components': 'off',
      /*
        Tests are not shipped, and React writes every error a boundary catches
        to `console.error`. Silencing that noise is the one legitimate reason to
        name `console`, so the ban is lifted here and in `e2e` — nowhere else.
      */
      'no-console': 'off',
    },
  },

  {
    // Playwright specs are not React. Its fixture callback is named `use`,
    // which the hooks rules otherwise mistake for React's `use`.
    files: ['e2e/**', 'playwright.config.ts'],
    rules: {
      ...Object.fromEntries(
        Object.keys(reactHooks.configs.recommended.rules ?? {}).map((rule) => [rule, 'off']),
      ),
      'react-refresh/only-export-components': 'off',
      'no-console': 'off',
    },
  },
)
