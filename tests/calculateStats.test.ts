import { describe, it, expect } from 'vitest'
import { createEditor } from 'slate'
import { calculateStats } from '../lib/main'
import {
  simpleTextContent,
  unicodeTextContent,
  vignetteContent,
  multipleNodesContent,
  nonWordCharsContent,
  nonTextClassContent,
  imageWithTextClassContent,
  factboxContent
} from './_fixtures'

describe('calculateStats', () => {
  it('counts words and characters in simple text', () => {
    const editor = createEditor()
    editor.children = simpleTextContent

    const stats = calculateStats(editor)

    expect(stats.full.words).toBe(2)
    expect(stats.full.characters).toBe(12) // includes space and punctuation
  })

  it('handles unicode words', () => {
    const editor = createEditor()
    editor.children = unicodeTextContent

    const stats = calculateStats(editor)

    expect(stats.full.words).toBe(2)
    expect(stats.full.characters).toBe(6)
  })

  it('ignores vignette role in short stats', () => {
    const editor = createEditor()
    editor.children = vignetteContent

    const stats = calculateStats(editor)

    expect(stats.short.words).toBe(0)
    expect(stats.short.characters).toBe(0)
  })

  it('counts multiple nodes', () => {
    const editor = createEditor()
    editor.children = multipleNodesContent

    const stats = calculateStats(editor)

    expect(stats.full.words).toBe(3)
    expect(stats.full.characters).toBe(12)
  })

  it('doesnt count non-word chars as words', () => {
    const editor = createEditor()
    editor.children = nonWordCharsContent

    const stats = calculateStats(editor)

    expect(stats.full.words).toBe(13)
    expect(stats.full.characters).toBe(66)
  })

  it('doesnt count full stats for anything without class text', () => {
    const editor = createEditor()
    editor.children = nonTextClassContent

    const stats = calculateStats(editor)

    expect(stats.full.words).toBe(0)
    expect(stats.full.characters).toBe(0)
  })

  it('counts full stats for everything with class text', () => {
    const editor = createEditor()
    editor.children = imageWithTextClassContent

    const stats = calculateStats(editor)

    expect(stats.full.words).toBe(1)
    expect(stats.full.characters).toBe(4)
  })

  it('counts full stats for nested text nodes in factbox', () => {
    const editor = createEditor()
    editor.children = factboxContent

    const stats = calculateStats(editor)

    expect(stats.full.words).toBe(25)
    expect(stats.full.characters).toBe(184)
  })
})
