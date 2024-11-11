// eslint.config.js
import tseslint from 'typescript-eslint'
import eslint from '@eslint/js'
import reactPlugin from 'eslint-plugin-react'
import jestPlugin from 'eslint-plugin-jest'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import stylistic from '@stylistic/eslint-plugin'

export default tseslint.config(
  {
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,jsx,tsx}']
  },
  {
    ignores: ['**/dist/**', '**/coverage/**']
  },
  eslint.configs.recommended,
  reactPlugin.configs.flat.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  stylistic.configs.customize({
    indent: 2,
    quote: 'single',
    braceStyle: '1tbs',
    arrowParens: true,
    semi: false,
    jsx: true
  }),

  {
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      '@stylistic': stylistic,
      'react-hooks': reactHooksPlugin,
      jest: jestPlugin
    },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
      '@stylistic/comma-dangle': ['error', 'never'],
      '@stylistic/jsx-quotes': ['error', 'prefer-single'],
      'react/react-in-jsx-scope': 'off',

      '@stylistic/no-multiple-empty-lines': ['warn', {
        max: 2,
        maxEOF: 1
      }],
      '@stylistic/quote-props': ['error', 'as-needed'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true
        }
      ],

      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',

      // Disable prop-types rule as we're using TypeScript
      'react/prop-types': 'off',

      // FIXME: This can be turned on when using vitest instead of jest
      // 'prefer-const': 'off',

      // FIXME: These offs should result in errors in the future
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/require-await': 'warn',
      'react-hooks/exhaustive-deps': 'warn',

      // Keep these off
      '@stylistic/indent': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@stylistic/jsx-curly-newline': 'off'
    }
  },
  {
    // disable type-aware linting on JS files
    files: ['**/*.mjs', '**/*.cjs', '**/*.js'],
    ...tseslint.configs.disableTypeChecked
  },
  {
    // enable jest rules on test files
    files: ['test/**'],
    ...jestPlugin.configs['flat/recommended']
  }
)
