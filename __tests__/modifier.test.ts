import { describe, it, expect, vi, afterEach } from 'vitest'
import { modifier, isMac } from '@/utils/modifier'

describe('modifier (textbit hotkey legend formatter)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('on Mac', () => {
    it('renders modifier glyphs joined without a separator', () => {
      expect(modifier('mod+option+1', true)).toBe('⌘⌥1')
    })

    it('maps mod, shift, ctrl/control, alt/option to glyphs', () => {
      expect(modifier('mod+b', true)).toBe('⌘B')
      expect(modifier('mod+i', true)).toBe('⌘I')
      expect(modifier('mod+u', true)).toBe('⌘U')
      expect(modifier('shift+ctrl+a', true)).toBe('⇧⌃A')
      expect(modifier('mod+alt+1', true)).toBe('⌘⌥1')
      expect(modifier('mod+option+1', true)).toBe('⌘⌥1')
      expect(modifier('mod+control+1', true)).toBe('⌘⌃1')
      expect(modifier('mod+opt+1', true)).toBe('⌘⌥1')
    })

    it('maps arrow keys to arrow glyphs', () => {
      expect(modifier('mod+option+up', true)).toBe('⌘⌥↑')
      expect(modifier('mod+option+down', true)).toBe('⌘⌥↓')
      expect(modifier('mod+option+left', true)).toBe('⌘⌥←')
      expect(modifier('mod+option+right', true)).toBe('⌘⌥→')
    })
  })

  describe('on non-Mac (Windows / Linux / Chromebook)', () => {
    it('renders modifier names joined by plus signs', () => {
      expect(modifier('mod+option+1', false)).toBe('Ctrl+Alt+1')
    })

    it('maps mod and ctrl/control to "Ctrl"', () => {
      expect(modifier('mod+b', false)).toBe('Ctrl+B')
      expect(modifier('ctrl+b', false)).toBe('Ctrl+B')
      expect(modifier('control+b', false)).toBe('Ctrl+B')
    })

    it('maps option/alt to "Alt"', () => {
      expect(modifier('mod+option+1', false)).toBe('Ctrl+Alt+1')
      expect(modifier('mod+alt+1', false)).toBe('Ctrl+Alt+1')
      expect(modifier('mod+opt+1', false)).toBe('Ctrl+Alt+1')
    })

    it('uppercases single-letter keys', () => {
      expect(modifier('mod+i', false)).toBe('Ctrl+I')
      expect(modifier('mod+u', false)).toBe('Ctrl+U')
    })

    it('passes digits through unchanged', () => {
      expect(modifier('mod+option+0', false)).toBe('Ctrl+Alt+0')
      expect(modifier('mod+option+3', false)).toBe('Ctrl+Alt+3')
    })

    it('maps arrow keys to arrow glyphs even on PC', () => {
      expect(modifier('mod+option+up', false)).toBe('Ctrl+Alt+↑')
      expect(modifier('mod+option+down', false)).toBe('Ctrl+Alt+↓')
    })
  })

  describe('edge cases', () => {
    it('returns empty string for empty input', () => {
      expect(modifier('', false)).toBe('')
      expect(modifier('', true)).toBe('')
    })

    it('handles a single key without modifiers', () => {
      expect(modifier('b', false)).toBe('B')
      expect(modifier('b', true)).toBe('B')
    })

    it('is case-insensitive on input tokens', () => {
      expect(modifier('MOD+OPTION+1', false)).toBe('Ctrl+Alt+1')
      expect(modifier('MOD+OPTION+1', true)).toBe('⌘⌥1')
    })
  })
})

describe('isMac', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('prefers userAgentData.platform when present', () => {
    vi.stubGlobal('navigator', {
      userAgentData: { platform: 'macOS' },
      platform: 'Win32',
      userAgent: 'Mozilla/5.0 (irrelevant)'
    })
    expect(isMac()).toBe(true)
  })

  it('returns false when userAgentData reports Windows even if userAgent contains "Mac"', () => {
    vi.stubGlobal('navigator', {
      userAgentData: { platform: 'Windows' },
      platform: 'MacIntel',
      userAgent: 'Macintosh; misleading'
    })
    expect(isMac()).toBe(false)
  })

  it('falls back to navigator.platform', () => {
    vi.stubGlobal('navigator', { platform: 'MacIntel', userAgent: 'irrelevant' })
    expect(isMac()).toBe(true)
    vi.stubGlobal('navigator', { platform: 'Win32', userAgent: 'irrelevant' })
    expect(isMac()).toBe(false)
    vi.stubGlobal('navigator', { platform: 'Linux x86_64', userAgent: 'irrelevant' })
    expect(isMac()).toBe(false)
  })

  it('falls back to userAgent', () => {
    vi.stubGlobal('navigator', {
      platform: '',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
    })
    expect(isMac()).toBe(true)
    vi.stubGlobal('navigator', {
      platform: '',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    })
    expect(isMac()).toBe(false)
  })

  it('returns false when navigator is undefined', () => {
    vi.stubGlobal('navigator', undefined)
    expect(isMac()).toBe(false)
  })
})
