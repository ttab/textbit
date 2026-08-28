import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Subpaths count too: a bundled react/jsx-runtime leaves a require('react') in
// the ESM output that throws under Node.
const externalDeps = [
  '@slate-yjs/core',
  '@slate-yjs/react',
  'react',
  'react-dom',
  'slate',
  'slate-react',
  'slate-history',
  'yjs'
]

export default defineConfig({
  plugins: [
    react(),
    dts({
      tsconfigPath: './tsconfig.lib.json',
      insertTypesEntry: true,
      include: ['lib/**/*'],
      exclude: ['**/*.test.*', '**/*.spec.*']
    })
  ],
  resolve: {
    dedupe: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'slate',
      'slate-react',
      'slate-history',
      '@slate-yjs/core',
      '@slate-yjs/react',
      'yjs'
    ]
  },
  publicDir: false,
  build: {
    lib: {
      entry: resolve(__dirname, 'lib/main.ts'),
      name: 'Textbit',
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      external: (id) => externalDeps.some((dep) => id === dep || id.startsWith(`${dep}/`)),
      output: {
        globals: {
          '@slate-yjs/core': 'SlateYjs',
          '@slate-yjs/react': 'SlateYjsReact',
          'react': 'React',
          'react/jsx-runtime': 'jsxRuntime',
          'react-dom': 'ReactDOM',
          'slate': 'Slate',
          'slate-react': 'SlateReact',
          'slate-history': 'SlateHistory',
          'yjs': 'Y'
        }
      }
    }
  }
})
