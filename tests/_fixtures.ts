import type { Descendant } from 'slate'

/**
 * Basic editor content with a heading and paragraph
 */
export const basicEditorContent: Descendant[] = [
  {
    type: 'core/text',
    id: 'be0ec554-839d-413c-9140-c408cb213f1e',
    class: 'text',
    children: [
      { text: 'This is title' }
    ],
    properties: {
      type: 'h1'
    }
  },
  {
    type: 'core/text',
    class: 'text',
    id: 'fc542b22-6046-49d8-8eae-56a8597599a3',
    children: [{ text: 'This is paragraph' }],
    properties: {}
  }
]

/**
 * Simple text for word/character counting
 */
export const simpleTextContent: Descendant[] = [
  {
    type: 'core/text',
    class: 'text',
    id: 'simple-text-1',
    properties: {},
    children: [{ text: 'Hello world!' }]
  }
]

/**
 * Unicode text content
 */
export const unicodeTextContent: Descendant[] = [
  {
    type: 'core/text',
    class: 'text',
    id: 'unicode-text-1',
    properties: {},
    children: [{ text: 'åäö éü' }]
  }
]

/**
 * Content with vignette role (should be ignored in short stats)
 */
export const vignetteContent: Descendant[] = [
  {
    type: 'core/text',
    class: 'text',
    id: 'vignette-1',
    properties: { role: 'vignette' },
    children: [{ text: 'Should not count' }]
  }
]

/**
 * Multiple text nodes
 */
export const multipleNodesContent: Descendant[] = [
  {
    type: 'core/text',
    class: 'text',
    id: 'multi-1',
    properties: {},
    children: [{ text: 'One' }]
  },
  {
    type: 'core/text',
    class: 'text',
    id: 'multi-2',
    properties: {},
    children: [{ text: 'Two three' }]
  }
]

/**
 * Text with non-word characters
 */
export const nonWordCharsContent: Descendant[] = [
  {
    type: 'core/text',
    class: 'text',
    id: 'non-word-1',
    properties: {},
    children: [{ text: '– En dash is not considered a word, neither is & or @ but this is!' }]
  }
]

/**
 * Non-text class content (should not count in stats)
 */
export const nonTextClassContent: Descendant[] = [
  {
    type: 'tt/visual/image',
    class: 'block',
    id: 'image-1',
    children: [{ text: 'test' }]
  }
]

/**
 * Image with text class (should count in stats)
 */
export const imageWithTextClassContent: Descendant[] = [
  {
    type: 'tt/visual/image',
    class: 'text',
    id: 'image-text-1',
    children: [{ text: 'test' }]
  }
]

/**
 * Complex factbox structure with nested text nodes
 */
export const factboxContent: Descendant[] = [
  {
    id: 'd653b9ff-fe7e-469c-8438-4e00c4b75570',
    class: 'text',
    type: 'core/factbox/title',
    children: [
      {
        text: 'Fakta: Schimpans'
      }
    ]
  },
  {
    id: 'a73c880b-3a63-4138-906c-d039b0dbd9af',
    class: 'block',
    type: 'core/factbox/body',
    children: [
      {
        id: 'ef166300-2d05-4182-ab9b-235310562914',
        type: 'core/text',
        properties: {},
        class: 'text',
        children: [
          {
            text: 'Schimpansen (Pan troglodytes) är, tillsammans med bonobon (Pan paniscus), människans närmaste släkting. Den delar nära 99 procent av sitt dna med den moderna människan.'
          }
        ]
      }
    ]
  }
]

/**
 * Empty editor content
 */
export const emptyEditorContent: Descendant[] = [
  {
    type: 'core/text',
    class: 'text',
    id: 'empty-node',
    properties: {},
    children: [{ text: '' }]
  }
]

/**
 * Content with formatting (bold, italic, etc.)
 */
export const formattedTextContent: Descendant[] = [
  {
    type: 'core/text',
    class: 'text',
    id: 'formatted-1',
    properties: {},
    children: [
      { text: 'This is ' },
      { text: 'bold', bold: true },
      { text: ' and this is ' },
      { text: 'italic', italic: true },
      { text: ' text.' }
    ]
  }
]
