// Smoke test for the built package root.
//
// `payload.config.ts` imports the package root in plain Node (config loading, import
// map and type generation), so the root must not pull in anything Node can't load —
// most notably stylesheets imported by client components. Run after `pnpm build`.
import { access } from 'node:fs/promises'

const entry = new URL('../dist/index.js', import.meta.url)

try {
  await access(entry)
} catch {
  console.error('dist/index.js not found — run `pnpm build` first.')
  process.exit(1)
}

try {
  const mod = await import(entry.href)
  if (typeof mod.payloadEnhancedSidebar !== 'function') {
    throw new Error('`payloadEnhancedSidebar` is not exported from the package root')
  }
  console.log('Package root loads in plain Node.')
} catch (error) {
  console.error('Package root failed to load in plain Node:\n')
  console.error(error)
  process.exit(1)
}
