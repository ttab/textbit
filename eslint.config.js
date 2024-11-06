// eslint.config.js
import elephant from '@ttab/eslint-config-elephant'

export default [
  ...elephant,
  {
    rules: {
      '@typescript-eslint/no-namespace': 'off'
    }
  }
]
