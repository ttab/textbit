import { describe, it, expect } from 'vitest'
import { normalizeWhitespace } from '../lib/utils/normalizeWhitespace'

// U+00A0 built from its char code so the test source stays ASCII.
const NBSP = String.fromCharCode(0xa0)

describe('normalizeWhitespace', () => {
  it('returns empty input unchanged', () => {
    expect(normalizeWhitespace('')).toBe('')
  })

  it('collapses multiple regular spaces to one', () => {
    expect(normalizeWhitespace('a    b')).toBe('a b')
  })

  it('turns line breaks and tabs into a single space', () => {
    expect(normalizeWhitespace('a\n\tb')).toBe('a b')
  })

  it('keeps a lone non-breaking space', () => {
    expect(normalizeWhitespace(`1${NBSP}000`)).toBe(`1${NBSP}000`)
  })

  it('collapses multiple non-breaking spaces to a single one', () => {
    expect(normalizeWhitespace(`1${NBSP}${NBSP}000`)).toBe(`1${NBSP}000`)
  })

  it('keeps a non-breaking space when a run mixes it with regular spaces', () => {
    expect(normalizeWhitespace(`a ${NBSP} b`)).toBe(`a${NBSP}b`)
  })
})
