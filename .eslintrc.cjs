module.exports = {
  settings: {
    react: {
      version: 'detect'
    }
  },
  root: true,
  env: {
    browser: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'love'
  ],
  ignorePatterns: ['dist'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true }
    ],
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    'no-multiple-empty-lines': ['warn', { max: 2, maxEOF: 1 }],
    '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
    '@typescript-eslint/space-before-function-paren': ['warn', {
      asyncArrow: 'always',
      anonymous: 'never',
      named: 'never'
    }],
    'space-before-function-paren': ['warn', {
      asyncArrow: 'always',
      anonymous: 'never',
      named: 'never'
    }],
    'react/react-in-jsx-scope': 'off',
    'no-use-before-define': 'off',
    '@typescript-eslint/no-use-before-define': ['error'],
    'react/jsx-indent': ['error', 2],
    'react/jsx-indent-props': ['error', 2],
    'react/jsx-tag-spacing': ['error']
  }
}
