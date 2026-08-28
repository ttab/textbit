import { describe, expect, it } from 'vitest'
import config from '../vite.config'

const external = config.build?.rollupOptions?.external

function isExternal(id: string): boolean {
  if (typeof external !== 'function') {
    throw new Error('build.rollupOptions.external must be a function to match subpaths')
  }

  return external(id, undefined, false) === true
}

describe('library externals', () => {
  it('keeps peer dependencies out of the bundle', () => {
    for (const id of ['react', 'react-dom', 'slate', 'slate-react', 'yjs', '@slate-yjs/react']) {
      expect(isExternal(id), id).toBe(true)
    }
  })

  // Bundling these leaves a require() for an external in the ESM output, which
  // throws as soon as Node imports the package.
  it('keeps peer dependency subpaths out of the bundle', () => {
    for (const id of ['react/jsx-runtime', 'react-dom/client', '@slate-yjs/core/dist']) {
      expect(isExternal(id), id).toBe(true)
    }
  })

  it('still bundles own dependencies', () => {
    for (const id of ['is-hotkey', 'y-protocols/awareness']) {
      expect(isExternal(id), id).toBe(false)
    }
  })
})
