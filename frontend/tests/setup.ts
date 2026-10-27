// Matchers de Testing Library solo en pruebas con DOM (`// @vitest-environment jsdom`).
if (typeof document !== 'undefined') {
  await import('@testing-library/jest-dom/vitest')
  const { cleanup } = await import('@testing-library/react')
  const { afterEach } = await import('vitest')
  afterEach(() => cleanup())
}
