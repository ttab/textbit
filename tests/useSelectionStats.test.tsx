import { describe, test, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSlateStatic } from 'slate-react'
import { type PropsWithChildren } from 'react'
import { Transforms, type Descendant } from 'slate'
import { TextbitRoot } from '../lib/components/TextbitRoot'
import { TextbitEditable } from '../lib/components/TextbitEditable/TextbitEditable'
import { useSelectionStats } from '../lib/hooks/useSelectionStats'

// A top-level text block, a block element with two text children (caption +
// byline), and a third top-level text block. Mirrors the real article shape:
// paragraphs around a captioned-image block.
const content: Descendant[] = [
  {
    id: 'p1',
    type: 'core/text',
    class: 'text',
    properties: {},
    children: [{ text: 'first paragraph' }]
  },
  {
    id: 'block',
    type: 'test/block',
    class: 'block',
    children: [
      {
        id: 'caption',
        type: 'test/block/caption',
        class: 'text',
        children: [{ text: 'hello caption' }]
      },
      {
        id: 'byline',
        type: 'test/block/byline',
        class: 'text',
        children: [{ text: 'by author' }]
      }
    ]
  },
  {
    id: 'p2',
    type: 'core/text',
    class: 'text',
    properties: {},
    children: [{ text: 'second paragraph' }]
  }
]

function makeWrapper() {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <TextbitRoot value={content} onChange={() => {}}>
        <TextbitEditable>{children}</TextbitEditable>
      </TextbitRoot>
    )
  }
}

function renderBoth() {
  const wrapper = makeWrapper()
  return renderHook(
    () => ({ editor: useSlateStatic(), stats: useSelectionStats() }),
    { wrapper }
  )
}

describe('useSelectionStats', () => {
  test('returns zeros when there is no selection', () => {
    const { result } = renderBoth()
    expect(result.current.stats).toEqual({ words: 0, characters: 0, charactersNoSpaces: 0 })
  })

  test('returns zeros when the selection is collapsed', async () => {
    const { result } = renderBoth()

    await act(async () => {
      Transforms.select(result.current.editor, {
        anchor: { path: [0, 0], offset: 3 },
        focus: { path: [0, 0], offset: 3 }
      })
    })

    expect(result.current.stats).toEqual({ words: 0, characters: 0, charactersNoSpaces: 0 })
  })

  test('counts text, words, and chars-no-spaces inside a single text block', async () => {
    const { result } = renderBoth()

    // Select all 15 chars of 'first paragraph' (2 words, 14 non-space chars).
    await act(async () => {
      Transforms.select(result.current.editor, {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [0, 0], offset: 15 }
      })
    })

    expect(result.current.stats).toEqual({ words: 2, characters: 15, charactersNoSpaces: 14 })
  })

  test('counts across a block element, including its caption and byline', async () => {
    // Selection spans from the first paragraph through the caption and byline
    // into the second paragraph. The issue says: count everything; don't
    // special-case block children.
    const { result } = renderBoth()

    await act(async () => {
      Transforms.select(result.current.editor, {
        anchor: { path: [0, 0], offset: 0 },
        focus: { path: [2, 0], offset: 16 }
      })
    })

    // 'first paragraph' (15, 14 non-space) + 'hello caption' (13, 12) +
    // 'by author' (9, 8) + 'second paragraph' (16, 15) = 53 / 49. 8 words.
    expect(result.current.stats).toEqual({ words: 8, characters: 53, charactersNoSpaces: 49 })
  })
})
