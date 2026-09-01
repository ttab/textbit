import { describe, test, expect } from 'vitest'
import { render } from '@testing-library/react'
import type { Descendant } from 'slate'
import { TextbitRoot } from '../lib/components/TextbitRoot'
import { TextbitEditable } from '../lib/components/TextbitEditable/TextbitEditable'
import type { PluginDefinition } from '../lib/types'

function renderEditor(
  value: Descendant[],
  options?: { lang?: string, plugins?: PluginDefinition[] }
) {
  return render(
    <TextbitRoot value={value} onChange={() => {}} lang={options?.lang} plugins={options?.plugins}>
      <TextbitEditable />
    </TextbitRoot>
  )
}

// Test plugin with a text-class child rendered through the default <div> wrapper
const captionBlockPlugin: PluginDefinition = {
  class: 'block',
  name: 'test/caption-block',
  componentEntry: {
    class: 'block',
    component: ({ children }) => <div>{children}</div>,
    children: [
      {
        type: 'caption',
        class: 'text',
        component: ({ children }) => <>{children}</>,
        constraints: { min: 1, max: 1 }
      }
    ]
  }
}

// Test plugin whose text-class child opts into asOwnElement; the component is
// responsible for spreading `attributes`, so we can assert on the resulting
// DOM attributes directly.
const ownCaptionBlockPlugin: PluginDefinition = {
  class: 'block',
  name: 'test/own-caption-block',
  componentEntry: {
    class: 'block',
    component: ({ children }) => <div>{children}</div>,
    children: [
      {
        type: 'caption',
        class: 'text',
        asOwnElement: true,
        component: ({ children, attributes }) => <p {...attributes}>{children}</p>,
        constraints: { min: 1, max: 1 }
      }
    ]
  }
}

describe('ParentElement wrapper attributes', () => {
  describe('data-id and data-type', () => {
    test('emits data-id from element.id and data-type from element.type', () => {
      const { container } = renderEditor([
        {
          type: 'core/text',
          class: 'text',
          id: 'attr-basic',
          properties: {},
          children: [{ text: 'Hello' }]
        }
      ])

      const wrapper = container.querySelector('[data-slate-node="element"][data-id="attr-basic"]')
      expect(wrapper).not.toBeNull()
      expect(wrapper?.getAttribute('data-type')).toBe('core/text')
    })
  })

  describe('data-role', () => {
    test('emits data-role when properties.role is a non-empty string', () => {
      const { container } = renderEditor([
        {
          type: 'core/text',
          class: 'text',
          id: 'role-set',
          properties: { role: 'heading-1' },
          children: [{ text: 'Title' }]
        }
      ])

      const wrapper = container.querySelector('[data-slate-node="element"][data-id="role-set"]')
      expect(wrapper?.getAttribute('data-role')).toBe('heading-1')
    })

    test('omits data-role when properties.role is missing', () => {
      const { container } = renderEditor([
        {
          type: 'core/text',
          class: 'text',
          id: 'role-missing',
          properties: {},
          children: [{ text: 'Body' }]
        }
      ])

      const wrapper = container.querySelector('[data-slate-node="element"][data-id="role-missing"]')
      expect(wrapper?.hasAttribute('data-role')).toBe(false)
    })

    test('omits data-role when properties.role is an empty string', () => {
      const { container } = renderEditor([
        {
          type: 'core/text',
          class: 'text',
          id: 'role-empty',
          properties: { role: '' },
          children: [{ text: 'Body' }]
        }
      ])

      const wrapper = container.querySelector('[data-slate-node="element"][data-id="role-empty"]')
      expect(wrapper?.hasAttribute('data-role')).toBe(false)
    })
  })

  describe('lang', () => {
    test('uses element.lang when set', () => {
      const { container } = renderEditor([
        {
          type: 'core/text',
          class: 'text',
          id: 'lang-element',
          lang: 'sv-se',
          properties: {},
          children: [{ text: 'Hej' }]
        }
      ])

      const wrapper = container.querySelector('[data-slate-node="element"][data-id="lang-element"]')
      expect(wrapper?.getAttribute('lang')).toBe('sv-se')
    })

    test('falls back to editor lang when element.lang is not set', () => {
      const { container } = renderEditor(
        [
          {
            type: 'core/text',
            class: 'text',
            id: 'lang-editor',
            properties: {},
            children: [{ text: 'Hello' }]
          }
        ],
        { lang: 'en-us' }
      )

      const wrapper = container.querySelector('[data-slate-node="element"][data-id="lang-editor"]')
      expect(wrapper?.getAttribute('lang')).toBe('en-us')
    })
  })

  describe('data-state', () => {
    test('defaults to inactive when the block is not focused', () => {
      const { container } = renderEditor([
        {
          type: 'core/text',
          class: 'text',
          id: 'state-a',
          properties: {},
          children: [{ text: 'First' }]
        },
        {
          type: 'core/text',
          class: 'text',
          id: 'state-b',
          properties: {},
          children: [{ text: 'Second' }]
        }
      ])

      const wrapper = container.querySelector('[data-slate-node="element"][data-id="state-b"]')
      expect(wrapper?.getAttribute('data-state')).toBe('inactive')
    })
  })
})

describe('ChildElement wrapper attributes (default <div> wrapper)', () => {
  function renderWithCaption(role: string | null) {
    const captionProps: Record<string, string> = {}
    if (role !== null) captionProps.role = role
    return renderEditor(
      [
        {
          type: 'test/caption-block',
          class: 'block',
          id: 'parent-block',
          children: [
            {
              type: 'test/caption-block/caption',
              class: 'text',
              id: 'child-caption',
              properties: captionProps,
              children: [{ text: 'Caption text' }]
            }
          ]
        }
      ],
      { plugins: [captionBlockPlugin] }
    )
  }

  test('emits data-id and data-type on the child wrapper', () => {
    const { container } = renderWithCaption(null)
    const wrapper = container.querySelector('[data-slate-node="element"][data-id="child-caption"]')
    expect(wrapper).not.toBeNull()
    expect(wrapper?.getAttribute('data-type')).toBe('test/caption-block/caption')
  })

  test('emits data-role on the child wrapper when properties.role is set', () => {
    const { container } = renderWithCaption('subtitle')
    const wrapper = container.querySelector('[data-slate-node="element"][data-id="child-caption"]')
    expect(wrapper?.getAttribute('data-role')).toBe('subtitle')
  })

  test('omits data-role on the child wrapper when properties.role is missing', () => {
    const { container } = renderWithCaption(null)
    const wrapper = container.querySelector('[data-slate-node="element"][data-id="child-caption"]')
    expect(wrapper?.hasAttribute('data-role')).toBe(false)
  })

  test('omits data-role on the child wrapper when properties.role is empty', () => {
    const { container } = renderWithCaption('')
    const wrapper = container.querySelector('[data-slate-node="element"][data-id="child-caption"]')
    expect(wrapper?.hasAttribute('data-role')).toBe(false)
  })
})

describe('asOwnElement child component attributes', () => {
  function renderWithOwnCaption(role: string | null) {
    const captionProps: Record<string, string> = {}
    if (role !== null) captionProps.role = role
    return renderEditor(
      [
        {
          type: 'test/own-caption-block',
          class: 'block',
          id: 'own-parent-block',
          children: [
            {
              type: 'test/own-caption-block/caption',
              class: 'text',
              id: 'own-child-caption',
              properties: captionProps,
              children: [{ text: 'Caption text' }]
            }
          ]
        }
      ],
      { plugins: [ownCaptionBlockPlugin] }
    )
  }

  test('passes data-id and data-type via attributes onto the plugin root', () => {
    const { container } = renderWithOwnCaption(null)
    const root = container.querySelector('p[data-slate-node="element"][data-id="own-child-caption"]')
    expect(root).not.toBeNull()
    expect(root?.getAttribute('data-type')).toBe('test/own-caption-block/caption')
  })

  test('passes data-role via attributes when properties.role is set', () => {
    const { container } = renderWithOwnCaption('subtitle')
    const root = container.querySelector('p[data-slate-node="element"][data-id="own-child-caption"]')
    expect(root?.getAttribute('data-role')).toBe('subtitle')
  })

  test('omits data-role via attributes when properties.role is missing', () => {
    const { container } = renderWithOwnCaption(null)
    const root = container.querySelector('p[data-slate-node="element"][data-id="own-child-caption"]')
    expect(root?.hasAttribute('data-role')).toBe(false)
  })

  test('omits data-role via attributes when properties.role is empty', () => {
    const { container } = renderWithOwnCaption('')
    const root = container.querySelector('p[data-slate-node="element"][data-id="own-child-caption"]')
    expect(root?.hasAttribute('data-role')).toBe(false)
  })
})
