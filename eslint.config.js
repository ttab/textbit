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
      // '@stylistic/comma-dangle': ['error', 'never'],
      // '@stylistic/jsx-quotes': ['error', 'prefer-single'],
      'react/react-in-jsx-scope': 'off',

      '@stylistic/no-multiple-empty-lines': ['warn', {
        max: 2,
        maxEOF: 1
      }],
      '@stylistic/quote-props': ['error', 'as-needed'],
      // '@typescript-eslint/no-unused-vars': [
      //   'error',
      //   {
      //     args: 'all',
      //     argsIgnorePattern: '^_',
      //     caughtErrors: 'all',
      //     caughtErrorsIgnorePattern: '^_',
      //     destructuredArrayIgnorePattern: '^_',
      //     varsIgnorePattern: '^_',
      //     ignoreRestSiblings: true
      //   }
      // ],

      // These should be enabled as they add great value
      // Only level warn for now
      // '@typescript-eslint/no-unsafe-return': 'warn',
      // '@typescript-eslint/no-unsafe-call': 'warn',
      // '@typescript-eslint/no-unsafe-member-access': 'warn',
      // '@typescript-eslint/no-unsafe-assignment': 'warn',

      // Disable prop-types rule as we're using TypeScript
      'react/prop-types': 'off',

      // FIXME: These offs should be removed
      'no-empty': 'off',
      'no-var': 'off',
      'no-constant-binary-expression': 'off',
      'no-extra-boolean-cast': 'off',
      'no-undef': 'off',
      'prefer-const': 'off',
      'react-hooks/exhaustive-deps': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/no-duplicate-type-constituents': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@stylistic/member-delimiter-style': 'off',
      '@stylistic/brace-style': 'off',
      '@stylistic/arrow-parens': 'off',
      '@stylistic/quotes': 'off',
      '@stylistic/operator-linebreak': 'off',
      '@stylistic/padded-blocks': 'off',
      '@stylistic/no-multi-spaces': 'off',
      '@stylistic/indent': 'off',
      '@stylistic/jsx-wrap-multilines': 'off',
      '@stylistic/jsx-one-expression-per-line': 'off',
      '@stylistic/jsx-closing-tag-location': 'off',
      '@stylistic/comma-dangle': 'off',
      '@stylistic/jsx-quotes': 'off',
      '@stylistic/jsx-first-prop-new-line': 'off',
      '@stylistic/jsx-max-props-per-line': 'off',
      '@stylistic/jsx-closing-bracket-location': 'off',
      '@stylistic/jsx-tag-spacing': 'off',
      '@stylistic/multiline-ternary': 'off',
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

// export default [
//   ...elephant,
//   {
//     rules: {
//       'no-empty': 'off',
//       'no-var': 'off',
//       'no-constant-binary-expression': 'off',
//       'no-extra-boolean-cast': 'off',
//       'no-undef': 'off',
//       'prefer-const': 'off',
//       'react-hooks/exhaustive-deps': 'off',
//       '@typescript-eslint/no-namespace': 'off',
//       '@typescript-eslint/no-redundant-type-constituents': 'off',
//       '@typescript-eslint/no-explicit-any': 'off',
//       '@typescript-eslint/no-unsafe-member-access': 'off',
//       '@typescript-eslint/no-unsafe-assignment': 'off',
//       '@typescript-eslint/no-unsafe-call': 'off',
//       '@typescript-eslint/no-unused-vars': 'off',
//       '@typescript-eslint/no-unnecessary-type-assertion': 'off',
//       '@typescript-eslint/no-duplicate-type-constituents': 'off',
//       '@typescript-eslint/no-floating-promises': 'off',
//       '@typescript-eslint/restrict-template-expressions': 'off',
//       '@typescript-eslint/require-await': 'off',
//       '@typescript-eslint/no-unsafe-argument': 'off',
//       '@typescript-eslint/ban-ts-comment': 'off',
//       '@stylistic/member-delimiter-style': 'off',
//       '@stylistic/brace-style': 'off',
//       '@stylistic/arrow-parens': 'off',
//       '@stylistic/quotes': 'off',
//       '@stylistic/operator-linebreak': 'off',
//       '@stylistic/padded-blocks': 'off',
//       '@stylistic/no-multi-spaces': 'off',
//       '@stylistic/indent': 'off',
//       '@stylistic/jsx-wrap-multilines': 'off',
//       '@stylistic/jsx-one-expression-per-line': 'off',
//       '@stylistic/jsx-closing-tag-location': 'off',
//       '@stylistic/comma-dangle': 'off',
//       '@stylistic/jsx-quotes': 'off',
//       '@stylistic/jsx-first-prop-new-line': 'off',
//       '@stylistic/jsx-max-props-per-line': 'off',
//       '@stylistic/jsx-closing-bracket-location': 'off',
//       '@stylistic/jsx-tag-spacing': 'off',
//       '@stylistic/multiline-ternary': 'off',
//       '@stylistic/jsx-curly-newline': 'off'
//     }
//   }
// ]
