import { createEditor, Descendant } from 'slate'
import { calculateStats } from '../lib'

describe('calculateStats', () => {
  it('counts words and characters in simple text', () => {
    const nodes: Descendant[] = [
      { type: 'core/text', class: 'text', properties: {}, children: [{ text: 'Hello world!' }] }
    ]
    const editor = createEditor()
    editor.children = nodes

    const stats = calculateStats(editor)
    expect(stats.full.words).toBe(2)
    expect(stats.full.characters).toBe(12) // includes space and punctuation
  })

  it('handles unicode words', () => {
    const nodes: Descendant[] = [
      { type: 'core/text', class: 'text', properties: {}, children: [{ text: 'åäö éü' }] }
    ]
    const editor = createEditor()
    editor.children = nodes

    const stats = calculateStats(editor)
    expect(stats.full.words).toBe(2)
    expect(stats.full.characters).toBe(6)
  })

  it('ignores vignette role in short stats', () => {
    const nodes: Descendant[] = [
      { type: 'core/text', class: 'text', properties: { role: 'vignette' }, children: [{ text: 'Should not count' }] }
    ]

    const editor = createEditor()
    editor.children = nodes

    const stats = calculateStats(editor)
    expect(stats.short.words).toBe(0)
    expect(stats.short.characters).toBe(0)
  })

  it('counts multiple nodes', () => {
    const nodes: Descendant[] = [
      { type: 'core/text', class: 'text', properties: {}, children: [{ text: 'One' }] },
      { type: 'core/text', class: 'text', properties: {}, children: [{ text: 'Two three' }] }
    ]

    const editor = createEditor()
    editor.children = nodes

    const stats = calculateStats(editor)
    expect(stats.full.words).toBe(3)
    expect(stats.full.characters).toBe(12)
  })

  it('doesnt count non-word chars as words', () => {
    const nodes: Descendant[] = [
      { type: 'core/text', class: 'text', properties: {}, children: [{ text: '– En dash is not considered a word, neither is & or @ but this is!' }] }
    ]
    const editor = createEditor()
    editor.children = nodes

    const stats = calculateStats(editor)
    expect(stats.full.words).toBe(13)
    expect(stats.full.characters).toBe(66)
  })

  it('doesnt count full stats for anything without class text', () => {
    const nodes: Descendant[] = [{ type: 'tt/visual/image', children: [{ text: 'test' }] }]

    const editor = createEditor()
    editor.children = nodes

    const stats = calculateStats(editor)
    expect(stats.full.words).toBe(0)
    expect(stats.full.characters).toBe(0)
  })


  it('count full stats for everything with class text', () => {
    const nodes: Descendant[] = [{ type: 'tt/visual/image', class: 'text', children: [{ text: 'test' }] }]

    const editor = createEditor()
    editor.children = nodes

    const stats = calculateStats(editor)
    expect(stats.full.words).toBe(1)
    expect(stats.full.characters).toBe(4)
  })
})
