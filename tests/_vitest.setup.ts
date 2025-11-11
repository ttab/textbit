import { expect, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { webcrypto } from 'node:crypto'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Polyfill crypto for Node.js environment
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as Crypto
}

// Mock structuredClone globally for all tests
beforeAll(() => {
  if (!globalThis.structuredClone) {
    globalThis.structuredClone = ((val: unknown) => {
      return JSON.parse(JSON.stringify(val))
    }) as typeof structuredClone
  }
})
