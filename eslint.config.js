// eslint.config.js
import elephant from '@ttab/eslint-config-elephant'

export default [
  ...elephant,
  {
    rules: {
      'no-empty': 'off',
      'no-var': 'off',
      'no-constant-binary-expression': 'off',
      'no-extra-boolean-cast': 'off',
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
  }
]
