# `src/test`

Vitest setup and the shared render helper. Nothing here ships.

| File | |
| --- | --- |
| `setup.ts` | `jest-dom` matchers, a `ResizeObserver` stub, and `cleanup()` after every test |
| `renderWithTheme.tsx` | renders a component inside the app theme |

## `renderWithTheme`

The theme is the **only** real wrapper a component test gets. It is
configuration rather than logic, and without it every MUI component throws.

Everything else is mocked per test — hooks, child components, the modules a file
imports. That is what makes a failure name the file that broke rather than the
file that noticed.

```tsx
renderWithTheme(<DeviceTable devices={devices} onSelect={vi.fn()} … />)
```

It re-exports Testing Library and `userEvent`, so a test needs one import.

## These files have no tests of their own

They are test infrastructure: every other test exercises them, and a test for
the helper would only assert that rendering works. This is the one deliberate
exemption from "every source file has a test file".
