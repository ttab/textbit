import { join, resolve, relative, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { glob } from 'glob'

import { peerDependencies } from './package.json'

export default defineConfig({
  plugins: [
    react(),
    dts({ rollupTypes: true })
  ],
  build: {
    target: 'esnext',
    minify: true,
    lib: {
      entry: resolve(__dirname, join('lib', 'index.ts')),
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      // Exclude peer dependencies from the bundle to reduce bundle size
      external: [
        'react/jsx-runtime',
        ...Object.keys(peerDependencies)
      ],
      input: Object.fromEntries(
        glob.sync('lib/**/*.{ts,tsx}').map(file => [
          // The name of the entry point
          // lib/plugins/foo.ts becomes nested/foo
          relative(
            'lib',
            file.slice(0, file.length - extname(file).length)
          ),
          // The absolute path to the entry file
          // lib/plugins/foo.ts becomes /project/lib/nested/foo.ts
          fileURLToPath(new URL(file, import.meta.url))
        ])
      ),
      output: {
        preserveModules: false,
        chunkFileNames: 'chunks/[name].[hash].js',
        entryFileNames: '[name].[format].js'
      }
    }
  }
})
