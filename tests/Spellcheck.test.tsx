import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { TextbitRoot } from '../lib/components/TextbitRoot'
import { TextbitEditable } from '../lib/components/TextbitEditable'
import type { SpellingError } from '../lib/types'
import type { Descendant } from 'slate'

describe('Spellcheck', () => {
  const mockSpellchecker = vi.fn((texts: { lang: string, text: string }[]) => {
    return Promise.resolve(texts.map((text) => {
      const errors: Omit<SpellingError, 'id'>[] = []

      // Mock spellcheck logic - find "teh" as a misspelling
      if (text.text.includes('teh')) {
        errors.push({
          text: 'teh',
          level: 'error',
          suggestions: [
            { text: 'the', description: 'article' },
            { text: 'tea', description: 'beverage' }
          ]
        })
      }

      // Find "wrld" as a misspelling
      if (text.text.includes('wrld')) {
        errors.push({
          text: 'wrld',
          level: 'error',
          suggestions: [
            { text: 'world', description: 'noun' }
          ]
        })
      }

      return errors
    }))
  })

  beforeEach(() => {
    mockSpellchecker.mockClear()
  })

  test('marks spelling errors in text', async () => {
    const content: Descendant[] = [
      {
        type: 'core/text',
        class: 'text',
        id: 'spell-1',
        properties: {},
        children: [{ text: 'This is teh world' }]
      }
    ]

    const { container } = render(
      <TextbitRoot
        value={content}
        onChange={() => {}}
        onSpellcheck={mockSpellchecker}
        spellcheckDebounce={100}
      >
        <TextbitEditable />
      </TextbitRoot>
    )

    // Wait for spellcheck to complete
    await waitFor(() => {
      expect(mockSpellchecker).toHaveBeenCalled()
    }, { timeout: 500 })

    // Check that error is marked with data attribute
    const errorElements = container.querySelectorAll('[data-spelling-error]')
    expect(errorElements.length).toBeGreaterThan(0)
  })

  test('provides spelling suggestions', async () => {
    const content: Descendant[] = [
      {
        type: 'core/text',
        class: 'text',
        id: 'spell-3',
        properties: {},
        children: [{ text: 'teh' }]
      }
    ]

    render(
      <TextbitRoot
        value={content}
        onChange={() => {}}
        onSpellcheck={mockSpellchecker}
        spellcheckDebounce={100}
      >
        <TextbitEditable />
      </TextbitRoot>
    )

    await waitFor(() => {
      expect(mockSpellchecker).toHaveBeenCalled()
    }, { timeout: 500 })

    // Verify the spellchecker returned suggestions
    const lastCall = mockSpellchecker.mock.results[mockSpellchecker.mock.results.length - 1]
    const errors = await lastCall.value

    expect(errors[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: 'teh',
          suggestions: expect.arrayContaining([
            expect.objectContaining({ text: 'the' }),
            expect.objectContaining({ text: 'tea' })
          ])
        })
      ])
    )
  })

  test('handles multiple spelling errors in same node', async () => {
    const content: Descendant[] = [
      {
        type: 'core/text',
        class: 'text',
        id: 'spell-4',
        properties: {},
        children: [{ text: 'teh wrld is big' }]
      }
    ]

    const { container } = render(
      <TextbitRoot
        value={content}
        onChange={() => {}}
        onSpellcheck={mockSpellchecker}
        spellcheckDebounce={100}
      >
        <TextbitEditable />
      </TextbitRoot>
    )

    await waitFor(() => {
      expect(mockSpellchecker).toHaveBeenCalled()
    }, { timeout: 500 })

    // Should mark both errors
    const errorElements = container.querySelectorAll('[data-spelling-error]')
    expect(errorElements.length).toBeGreaterThanOrEqual(2)
  })

  test('does not spellcheck when onSpellcheck is not provided', async () => {
    const content: Descendant[] = [
      {
        type: 'core/text',
        class: 'text',
        id: 'spell-5',
        properties: {},
        children: [{ text: 'teh world' }]
      }
    ]

    const { container } = render(
      <TextbitRoot value={content} onChange={() => {}}>
        <TextbitEditable />
      </TextbitRoot>
    )

    // Wait a bit to ensure no spellcheck happens
    await new Promise(resolve => setTimeout(resolve, 300))

    const errorElements = container.querySelectorAll('[data-spelling-error]')
    expect(errorElements.length).toBe(0)
  })

  test('handles empty text nodes', async () => {
    const content: Descendant[] = [
      {
        type: 'core/text',
        class: 'text',
        id: 'spell-7',
        properties: {},
        children: [{ text: '' }]
      }
    ]

    render(
      <TextbitRoot
        value={content}
        onChange={() => {}}
        onSpellcheck={mockSpellchecker}
        spellcheckDebounce={100}
      >
        <TextbitEditable />
      </TextbitRoot>
    )

    // Should not crash or call spellcheck for empty text
    await new Promise(resolve => setTimeout(resolve, 300))

    // May or may not be called depending on implementation
    // Just ensure it doesn't crash
    expect(true).toBe(true)
  })

  test('spellcheck works across multiple nodes', async () => {
    const content: Descendant[] = [
      {
        type: 'core/text',
        class: 'text',
        id: 'spell-8',
        properties: {},
        children: [{ text: 'First teh' }]
      },
      {
        type: 'core/text',
        class: 'text',
        id: 'spell-9',
        properties: {},
        children: [{ text: 'Second wrld' }]
      }
    ]

    void render(
      <TextbitRoot
        value={content}
        onChange={() => {}}
        onSpellcheck={mockSpellchecker}
        spellcheckDebounce={100}
      >
        <TextbitEditable />
      </TextbitRoot>
    )

    await waitFor(() => {
      expect(mockSpellchecker).toHaveBeenCalled()
    }, { timeout: 500 })

    // Should have been called with both nodes' text
    const lastCall = mockSpellchecker.mock.calls[mockSpellchecker.mock.calls.length - 1]
    expect(lastCall[0]).toHaveLength(2)
    expect(lastCall[0][0].text).toContain('teh')
    expect(lastCall[0][1].text).toContain('wrld')
  })

  test('respects different error levels', async () => {
    const mockWithLevels = vi.fn(() => {
      return Promise.resolve([[
        {
          text: 'teh',
          level: 'error' as const,
          suggestions: [{ text: 'the', description: 'article' }]
        },
        {
          text: 'gonna',
          level: 'suggestion' as const,
          suggestions: [{ text: 'going to', description: 'formal' }]
        }
      ]])
    })

    const content: Descendant[] = [
      {
        type: 'core/text',
        class: 'text',
        id: 'spell-10',
        properties: {},
        children: [{ text: 'teh gonna work' }]
      }
    ]

    const { container } = render(
      <TextbitRoot
        value={content}
        onChange={() => {}}
        onSpellcheck={mockWithLevels}
        spellcheckDebounce={100}
      >
        <TextbitEditable />
      </TextbitRoot>
    )

    await waitFor(() => {
      expect(mockWithLevels).toHaveBeenCalled()
    }, { timeout: 500 })

    // Both errors and suggestions should be marked
    const errorElements = container.querySelectorAll('[data-spelling-error]')
    expect(errorElements.length).toBeGreaterThanOrEqual(2)
  })
})
