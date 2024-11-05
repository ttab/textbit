import { join, resolve, relative, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react-swc'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { glob } from 'glob'
import { peerDependencies } from './package.json'

export default defineConfig({
  root: '.', // ./index.html
  plugins: [
    react(),
    dts({
      rollupTypes: true
    })
  ],
  resolve: {
    mainFields: ['module', 'main'],
  },
  optimizeDeps: {
    exclude: ["fsevents", "jest-pnp-resolver"]
  },
  build: {
    target: 'esnext',
    minify: true,
    outDir: 'dist',
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
          relative(
            'lib',
            file.slice(0, file.length - extname(file).length)
          ),
          // The absolute path to the entry file
          // lib/plugins/foo.ts becomes /project/lib/nested/foo.ts
          fileURLToPath(new URL(file, import.meta.url))
        ])
      ),
      treeshake: {
        moduleSideEffects: false
      },
      output: {
        exports: 'named',
        // Ensure that all files in the `lib` folder are bundled into the output
        preserveModules: true,
        dir: 'dist',
        entryFileNames: '[name].js'
      }
    }
  }
})
