import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'

const __dirname = dirname(fileURLToPath(import.meta.url))

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
  publicDir: false,
  build: {
    lib: {
      entry: resolve(__dirname, 'lib/main.ts'),
      name: 'Textbit',
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'slate', 'slate-react', 'slate-history'],
      output: {
        globals: {
          'react': 'React',
          'react-dom': 'ReactDOM',
          'slate': 'Slate',
          'slate-react': 'SlateReact',
          'slate-history': 'SlateHistory'
        }
      }
    }
  }
})
