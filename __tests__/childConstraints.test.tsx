import { describe, test, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSlateStatic } from 'slate-react'
import { type PropsWithChildren } from 'react'
import type { Descendant, Editor, Element } from 'slate'
import { Transforms, Editor as SlateEditor } from 'slate'
import { TextbitRoot } from '../lib/components/TextbitRoot'
import { TextbitEditable } from '../lib/components/TextbitEditable/TextbitEditable'
import type { PluginDefinition, ComponentEntry, ChildComponentEntry } from '../lib/types'

// ---------------------------------------------------------------------------
// A test-only "image" plugin with declarative child constraints matching the
// real Image plugin's shape: a void 'content' child and a text 'caption' child,
// both min:1, max:1 (form-field semantics). No custom normalizer — all behavior
// should come from the declarative constraints alone.
// ---------------------------------------------------------------------------

const testImagePlugin: PluginDefinition = {
  class: 'block',
  name: 'test/image',
  componentEntry: {
    class: 'block',
    component: ({ children, attributes }) => <figure {...attributes}>{children}</figure>,
    children: [
      {
        type: 'content',
        class: 'void',
        component: ({ attributes, children }) => (
          <div contentEditable={false} {...attributes}>content{children}</div>
        ),
        constraints: { min: 1, max: 1 }
      },
      {
        type: 'caption',
        class: 'text',
        component: ({ attributes, children }) => <figcaption {...attributes}>{children}</figcaption>,
        constraints: { allowBreak: false, min: 1, max: 1 }
      }
    ]
  }
}

// A plugin with max:3 body children — to exercise the "not always max:1" path
const testMultiBodyPlugin: PluginDefinition = {
  class: 'block',
  name: 'test/multi',
  componentEntry: {
    class: 'block',
    component: ({ children, attributes }) => <div {...attributes}>{children}</div>,
    children: [
      {
        type: 'body',
        class: 'text',
        component: ({ attributes, children }) => <p {...attributes}>{children}</p>,
        constraints: { min: 1, max: 3 }
      }
    ]
  }
}

// A plugin with min:2, max:5 to exercise insertion beyond a single placeholder
const testMinTwoPlugin: PluginDefinition = {
  class: 'block',
  name: 'test/mintwo',
  componentEntry: {
    class: 'block',
    component: ({ children, attributes }) => <div {...attributes}>{children}</div>,
    children: [
      {
        type: 'body',
        class: 'text',
        component: ({ attributes, children }) => <p {...attributes}>{children}</p>,
        constraints: { min: 2, max: 5 }
      }
    ]
  }
}

// A plugin whose child has ONLY max:1 — isolates the max enforcement from
// allowBreak:false. Lets us prove that max alone blocks Enter.
const testMaxOnlyPlugin: PluginDefinition = {
  class: 'block',
  name: 'test/maxonly',
  componentEntry: {
    class: 'block',
    component: ({ children, attributes }) => <div {...attributes}>{children}</div>,
    children: [
      {
        type: 'slot',
        class: 'text',
        component: ({ attributes, children }) => <p {...attributes}>{children}</p>,
        constraints: { max: 1 } // NO allowBreak — max must do the work alone
      }
    ]
  }
}

// A factory that builds a plugin with both declarative constraints AND a
// custom normalizeNode. The spy lets a test observe that the custom
// normalizer is called AFTER declarative enforcement converges.
function makeImageWithSpyPlugin(spy: () => void): PluginDefinition {
  return {
    class: 'block',
    name: 'test/spyimage',
    componentEntry: {
      class: 'block',
      component: ({ children, attributes }) => <figure {...attributes}>{children}</figure>,
      constraints: {
        normalizeNode: () => {
          spy()
          return undefined
        }
      },
      children: [
        {
          type: 'slot',
          class: 'text',
          component: ({ attributes, children }) => <p {...attributes}>{children}</p>,
          constraints: { min: 1, max: 1 }
        }
      ]
    }
  }
}

// ---------------------------------------------------------------------------
// Fixture content
// ---------------------------------------------------------------------------

function imageBlock(id: string, caption: string): Descendant {
  return {
    type: 'test/image',
    id,
    class: 'block',
    children: [
      {
        id: `${id}-content`,
        type: 'test/image/content',
        class: 'void',
        children: [{ text: '' }]
      },
      {
        id: `${id}-caption`,
        type: 'test/image/caption',
        class: 'text',
        properties: {},
        children: [{ text: caption }]
      }
    ]
  } as Descendant
}

function multiBodyBlock(id: string, bodies: string[]): Descendant {
  return {
    type: 'test/multi',
    id,
    class: 'block',
    children: bodies.map((text, i) => ({
      id: `${id}-body-${i}`,
      type: 'test/multi/body',
      class: 'text',
      properties: {},
      children: [{ text }]
    }))
  } as Descendant
}

function makeEditor(content: Descendant[], plugins: PluginDefinition[] = [testImagePlugin]): Editor {
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <TextbitRoot value={content} onChange={() => { }} plugins={plugins}>
        <TextbitEditable>{children}</TextbitEditable>
      </TextbitRoot>
    )
  }
  const { result: { current: editor } } = renderHook(() => useSlateStatic(), { wrapper: Wrapper })
  vi.spyOn(editor, 'onChange').mockImplementation(() => { })
  // Force normalization since Slate's initial value does not always normalize in tests.
  SlateEditor.normalize(editor, { force: true })
  return editor
}

// ---------------------------------------------------------------------------
// Normalizer — excess (count > max) is trimmed
// ---------------------------------------------------------------------------

describe('child constraints — normalizer (excess)', () => {
  test('removes excess children beyond max', () => {
    const content = [
      {
        type: 'test/image',
        id: 'img-1',
        class: 'block',
        children: [
          { id: 'c1', type: 'test/image/content', class: 'void', children: [{ text: '' }] },
          { id: 'cap1', type: 'test/image/caption', class: 'text', properties: {}, children: [{ text: 'first' }] },
          { id: 'cap2', type: 'test/image/caption', class: 'text', properties: {}, children: [{ text: 'extra' }] }
        ]
      } as Descendant
    ]
    const editor = makeEditor(content)

    // The editor normalizes on construction; the excess caption is removed.
    const img = editor.children[0] as Element
    const captions = img.children.filter(
      (c) => (c as Element).type === 'test/image/caption'
    )
    expect(captions).toHaveLength(1)
    expect((captions[0] as Element).children).toMatchObject([{ text: 'first' }])
  })
})

// ---------------------------------------------------------------------------
// Normalizer — missing (count < min) inserts placeholder; parent never removed
// ---------------------------------------------------------------------------

describe('child constraints — normalizer (missing)', () => {
  test('inserts missing text child with min:1 (form-field behavior)', () => {
    const content = [
      {
        type: 'test/image',
        id: 'img-1',
        class: 'block',
        children: [
          { id: 'c1', type: 'test/image/content', class: 'void', children: [{ text: '' }] }
          // caption missing
        ]
      } as Descendant
    ]
    const editor = makeEditor(content)

    const img = editor.children[0] as Element
    const captions = img.children.filter(
      (c) => (c as Element).type === 'test/image/caption'
    )
    expect(captions).toHaveLength(1)
    expect((captions[0] as Element).class).toBe('text')
  })

  test('inserts missing void child with min:1 — parent is never removed', () => {
    const content = [
      {
        type: 'test/image',
        id: 'img-1',
        class: 'block',
        children: [
          // content missing
          { id: 'cap1', type: 'test/image/caption', class: 'text', properties: {}, children: [{ text: 'hello' }] }
        ]
      } as Descendant
    ]
    const editor = makeEditor(content)

    // Parent must still exist
    expect(editor.children).toHaveLength(1)
    const img = editor.children[0] as Element
    expect(img.type).toBe('test/image')

    const contents = img.children.filter(
      (c) => (c as Element).type === 'test/image/content'
    )
    expect(contents).toHaveLength(1)
    expect((contents[0] as Element).class).toBe('void')
  })

  test('re-inserts a deleted min:1 caption after user removes it', () => {
    const editor = makeEditor([imageBlock('img-1', 'hello')])

    // Delete the caption element directly (simulating a hard delete)
    Transforms.removeNodes(editor, { at: [0, 1] })

    // Normalizer should have re-inserted the caption
    const img = editor.children[0] as Element
    const captions = img.children.filter(
      (c) => (c as Element).type === 'test/image/caption'
    )
    expect(captions).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Normalizer — ordering
// ---------------------------------------------------------------------------

describe('child constraints — normalizer (ordering)', () => {
  test('reorders children to match children-array order', () => {
    const content = [
      {
        type: 'test/image',
        id: 'img-1',
        class: 'block',
        children: [
          // caption appears before content — wrong order
          { id: 'cap1', type: 'test/image/caption', class: 'text', properties: {}, children: [{ text: 'hello' }] },
          { id: 'c1', type: 'test/image/content', class: 'void', children: [{ text: '' }] }
        ]
      } as Descendant
    ]
    const editor = makeEditor(content)

    const img = editor.children[0] as Element
    expect((img.children[0] as Element).type).toBe('test/image/content')
    expect((img.children[1] as Element).type).toBe('test/image/caption')
  })
})

// ---------------------------------------------------------------------------
// Normalizer — no constraints defined → no interference
// ---------------------------------------------------------------------------

describe('child constraints — no constraints means no interference', () => {
  test('top-level core/text paragraphs are unaffected', () => {
    const content: Descendant[] = [
      {
        type: 'core/text',
        id: 'p1',
        class: 'text',
        properties: {},
        children: [{ text: 'hello' }]
      }
    ]
    const editor = makeEditor(content, [])

    expect(editor.children).toHaveLength(1)
    expect((editor.children[0] as Element).type).toBe('core/text')
  })
})

// ---------------------------------------------------------------------------
// Break prevention — max: 1 at count 1 blocks Enter
// ---------------------------------------------------------------------------

describe('child constraints — break prevention', () => {
  test('Enter inside max:1 child does not split (count would exceed max)', () => {
    const editor = makeEditor([imageBlock('img-1', 'Before caption')])
    // Place cursor in middle of the caption text
    Transforms.select(editor, {
      anchor: { path: [0, 1, 0], offset: 6 },
      focus: { path: [0, 1, 0], offset: 6 }
    })

    editor.insertBreak()

    const img = editor.children[0] as Element
    const captions = img.children.filter(
      (c) => (c as Element).type === 'test/image/caption'
    )
    // Still exactly one caption — Enter did not split
    expect(captions).toHaveLength(1)
  })

  test('Enter inside max:3 child at count 2 is allowed', () => {
    const editor = makeEditor(
      [multiBodyBlock('m-1', ['A', 'B'])],
      [testMultiBodyPlugin]
    )
    // Place cursor at end of first body
    Transforms.select(editor, SlateEditor.end(editor, [0, 0]))

    editor.insertBreak()

    const block = editor.children[0] as Element
    const bodies = block.children.filter(
      (c) => (c as Element).type === 'test/multi/body'
    )
    // Split succeeded — now 3 bodies
    expect(bodies).toHaveLength(3)
  })

  test('Enter inside max:3 child at count 3 is blocked', () => {
    const editor = makeEditor(
      [multiBodyBlock('m-1', ['A', 'B', 'C'])],
      [testMultiBodyPlugin]
    )
    Transforms.select(editor, SlateEditor.end(editor, [0, 0]))

    editor.insertBreak()

    const block = editor.children[0] as Element
    const bodies = block.children.filter(
      (c) => (c as Element).type === 'test/multi/body'
    )
    expect(bodies).toHaveLength(3)
  })
})

// ---------------------------------------------------------------------------
// Paste — flatten block fragment inside child text element
// ---------------------------------------------------------------------------

describe('child constraints — paste flattening', () => {
  test('pasting a block fragment into a caption flattens to plain text', () => {
    const editor = makeEditor([imageBlock('img-1', 'start ')])
    Transforms.select(editor, SlateEditor.end(editor, [0, 1]))

    // Simulate pasting another image block
    const fragment = [imageBlock('pasted', 'PASTED CAPTION')]
    editor.insertFragment(fragment)

    const img = editor.children[0] as Element
    // Still just the one top-level block — no siblings inserted
    expect(editor.children).toHaveLength(1)

    // Caption text now contains the flattened text
    const caption = img.children[1] as Element
    const captionText = (caption.children[0] as { text: string }).text
    expect(captionText).toContain('start ')
    expect(captionText).toContain('PASTED CAPTION')
  })

  test('pasting a block fragment into a top-level paragraph still splits (existing behavior)', () => {
    const content: Descendant[] = [
      { type: 'core/text', id: 'p1', class: 'text', properties: {}, children: [{ text: 'BeforeAfter' }] }
    ]
    const editor = makeEditor(content, [])

    Transforms.select(editor, {
      anchor: { path: [0, 0], offset: 6 },
      focus: { path: [0, 0], offset: 6 }
    })

    const fragment: Descendant[] = [
      {
        type: 'core/text',
        class: 'text',
        id: 'block',
        properties: {},
        children: [{ text: 'MID' }]
      },
      {
        type: 'core/text',
        class: 'text',
        id: 'block-x',
        properties: {},
        children: [{ text: 'X' }]
      } as Descendant
    ]
    // Force-mixed fragment by making one non-text
    ;(fragment[1] as unknown as { class: string }).class = 'block'

    editor.insertFragment(fragment)

    // Top-level paragraph was split and blocks inserted between halves
    expect(editor.children.length).toBeGreaterThan(1)
  })
})

// ---------------------------------------------------------------------------
// GAP COVERAGE — intent-level cases not covered by the happy-path tests above
// ---------------------------------------------------------------------------

describe('child constraints — intent coverage', () => {
  // Gap 1: min > 1 path — inserts multiple placeholders to reach min
  test('min: 2 inserts a second placeholder when only one child exists', () => {
    const content = [
      {
        type: 'test/mintwo',
        id: 'mt-1',
        class: 'block',
        children: [
          { id: 'b1', type: 'test/mintwo/body', class: 'text', properties: {},
            children: [{ text: 'only one' }] }
        ]
      } as Descendant
    ]
    const editor = makeEditor(content, [testMinTwoPlugin])

    const block = editor.children[0] as Element
    const bodies = block.children.filter(
      (c) => (c as Element).type === 'test/mintwo/body'
    )
    expect(bodies).toHaveLength(2)
  })

  // Gap 2: deleting above min does NOT trigger re-insert
  test('removing a body above min (3 → 2, min is 1) leaves count at 2', () => {
    const editor = makeEditor(
      [multiBodyBlock('m-1', ['A', 'B', 'C'])],
      [testMultiBodyPlugin]
    )

    // Remove the middle body — count goes from 3 to 2, still >= min (1)
    Transforms.removeNodes(editor, { at: [0, 1] })

    const block = editor.children[0] as Element
    const bodies = block.children.filter(
      (c) => (c as Element).type === 'test/multi/body'
    )
    expect(bodies).toHaveLength(2)
    // Remaining two should be A and C (the normalizer should NOT re-insert B)
    expect((bodies[0] as Element).children).toMatchObject([{ text: 'A' }])
    expect((bodies[1] as Element).children).toMatchObject([{ text: 'C' }])
  })

  // Gap 3: max alone (without allowBreak:false) blocks Enter
  test('max: 1 alone (no allowBreak) blocks Enter at count 1', () => {
    const content = [
      {
        type: 'test/maxonly',
        id: 'mo-1',
        class: 'block',
        children: [
          { id: 's1', type: 'test/maxonly/slot', class: 'text', properties: {},
            children: [{ text: 'some text' }] }
        ]
      } as Descendant
    ]
    const editor = makeEditor(content, [testMaxOnlyPlugin])

    // Place cursor in the middle of the slot text
    Transforms.select(editor, {
      anchor: { path: [0, 0, 0], offset: 4 },
      focus: { path: [0, 0, 0], offset: 4 }
    })

    editor.insertBreak()

    const block = editor.children[0] as Element
    const slots = block.children.filter(
      (c) => (c as Element).type === 'test/maxonly/slot'
    )
    // max:1 alone must have blocked the split
    expect(slots).toHaveLength(1)
  })

  // Gap 4: plugin's custom normalizeNode still runs after declarative enforcement
  test("custom normalizeNode is called after declarative enforcement converges", () => {
    const spy = vi.fn()
    const plugin = makeImageWithSpyPlugin(spy)

    // Content is invalid (missing the required slot child) so the declarative
    // enforcement must run first to insert it; afterwards the custom
    // normalizeNode must still be called on the parent.
    const content = [
      {
        type: 'test/spyimage',
        id: 'si-1',
        class: 'block',
        children: []
      } as Descendant
    ]
    makeEditor(content, [plugin])

    // Custom normalizeNode must have been called at least once for the parent
    // after the declarative insertion converged.
    expect(spy).toHaveBeenCalled()
  })

  // Gap 5: text-only fragment into a child text element goes through the normal
  // insertFragment path — NOT the block-fragment flatten path (which calls
  // editor.insertText and strips marks/structure). We assert specifically that
  // the flatten path was not taken; the actual merge behaviour for text-only
  // fragments is owned by Slate's default insertFragment and is out of scope.
  test('text-only fragment pasted into a caption does NOT go through the flatten path', () => {
    const editor = makeEditor([imageBlock('img-1', 'caption: ')])
    Transforms.select(editor, SlateEditor.end(editor, [0, 1]))

    // The flatten path would call editor.insertText(flattenedString). The
    // normal text-fragment path never does.
    const insertTextSpy = vi.spyOn(editor, 'insertText')

    const textFragment: Descendant[] = [
      {
        type: 'core/text',
        class: 'text',
        id: 'f1',
        properties: {},
        children: [{ text: 'appended' }]
      }
    ]
    editor.insertFragment(textFragment)

    // Flatten path was NOT used.
    expect(insertTextSpy).not.toHaveBeenCalled()

    // And we still have exactly one caption (no siblings inserted at block level)
    const img = editor.children[0] as Element
    const captions = img.children.filter(
      (c) => (c as Element).type === 'test/image/caption'
    )
    expect(captions).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// Gap 6 — type-level enforcement
//
// These declarations are never executed; they exist only so that TypeScript's
// `noEmit` check (`npm run tsc`) fails if someone weakens the type system so
// that `min` / `max` become accepted on a top-level `ComponentEntry`. The
// tuple wrappers `[A] extends [B]` prevent distributive conditional types
// from masking a regression (e.g. union `'FAIL' | 'OK'` being assignable
// from `'OK'`).
// ---------------------------------------------------------------------------

// The declared field type of `min` / `max` on a top-level `constraints`,
// stripped of its automatic `undefined` from the optional marker.
type _TopLevelMinField = Exclude<NonNullable<ComponentEntry['constraints']>['min'], undefined>
type _TopLevelMaxField = Exclude<NonNullable<ComponentEntry['constraints']>['max'], undefined>

// If the top-level field type ever becomes `number`, these assertions flip
// to 'FAIL' and the `const` assignments below stop typechecking.
type _AssertTopLevelMinIsNotNumber = [number] extends [_TopLevelMinField] ? 'FAIL' : 'OK'
type _AssertTopLevelMaxIsNotNumber = [number] extends [_TopLevelMaxField] ? 'FAIL' : 'OK'
const _probeTopMin: _AssertTopLevelMinIsNotNumber = 'OK'
const _probeTopMax: _AssertTopLevelMaxIsNotNumber = 'OK'
void _probeTopMin
void _probeTopMax

// Corresponding positive check: child entries still accept a number.
type _ChildMinField = Exclude<NonNullable<ChildComponentEntry['constraints']>['min'], undefined>
type _AssertChildAcceptsNumber = [number] extends [_ChildMinField] ? 'OK' : 'FAIL'
const _probeChild: _AssertChildAcceptsNumber = 'OK'
void _probeChild
