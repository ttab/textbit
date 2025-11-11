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

// Mock Range.getBoundingClientRect for jsdom
beforeAll(() => {
  Range.prototype.getBoundingClientRect = function() {
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      toJSON: () => {}
    }
  }

  Range.prototype.getClientRects = function() {
    return {
      length: 0,
      item: () => null,
      [Symbol.iterator]: function* () {}
    } as DOMRectList
  }
})

// Mock Element.getBoundingClientRect for better test support
beforeAll(() => {
  Element.prototype.getBoundingClientRect = function() {
    return {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      top: 0,
      left: 0,
      right: 100,
      bottom: 100,
      toJSON: () => {}
    }
  }
})

// Mock window.getSelection
beforeAll(() => {
  window.getSelection = function() {
    return {
      rangeCount: 0,
      addRange: () => {},
      removeRange: () => {},
      removeAllRanges: () => {},
      getRangeAt: () => new Range(),
      collapse: () => {},
      collapseToEnd: () => {},
      collapseToStart: () => {},
      containsNode: () => false,
      deleteFromDocument: () => {},
      empty: () => {},
      extend: () => {},
      modify: () => {},
      selectAllChildren: () => {},
      setBaseAndExtent: () => {},
      setPosition: () => {},
      toString: () => '',
      type: 'None',
      anchorNode: null,
      anchorOffset: 0,
      focusNode: null,
      focusOffset: 0,
      isCollapsed: true
    } as unknown as Selection
  }
})
