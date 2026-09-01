import { describe, test, expect } from 'vitest'
import { normalizeLineEndings } from '../lib/utils/normalizeLineEndings'

describe('normalizeLineEndings', () => {
  test('converts a Windows CRLF break to a single newline', () => {
    expect(normalizeLineEndings('Line one\r\nLine two')).toBe('Line one\nLine two')
  })

  test('a CRLF pair yields exactly one newline, not two', () => {
    // This is the whole point of the util: [\r\n]{2,} would see two breaks here
    // and mistake a plain Windows line break for a blank line.
    const normalized = normalizeLineEndings('a\r\nb')
    expect(normalized).toBe('a\nb')
    expect(/\n{2,}/.test(normalized)).toBe(false)
  })

  test('converts a lone classic Mac CR to a newline', () => {
    expect(normalizeLineEndings('Line one\rLine two')).toBe('Line one\nLine two')
  })

  test('leaves unix newlines untouched', () => {
    expect(normalizeLineEndings('a\nb\n\nc')).toBe('a\nb\n\nc')
  })

  test('handles mixed line endings', () => {
    expect(normalizeLineEndings('a\r\nb\rc\nd')).toBe('a\nb\nc\nd')
  })

  test('preserves genuine blank lines as stacked newlines', () => {
    const normalized = normalizeLineEndings('a\r\n\r\nb')
    expect(normalized).toBe('a\n\nb')
    expect(/\n{2,}/.test(normalized)).toBe(true)
  })

  test('returns an empty string unchanged', () => {
    expect(normalizeLineEndings('')).toBe('')
  })

  test('leaves text without line breaks unchanged', () => {
    expect(normalizeLineEndings('no breaks here')).toBe('no breaks here')
  })
})
