import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { createEditor, type Descendant, type Editor, type Element } from 'slate'
import { withHistory } from 'slate-history'
import { pipeFromDrop } from '../lib/utils/pipes'
import type { PluginDefinition, Resource } from '../lib/types'

// Characterization tests: pin the document-level contract of a drop pipe so the
// upcoming ephemeral-state rewrite is provably behaviour-preserving. They assert
// only on editor.children (never on the transient placeholder), so they hold for
// both the current loader-node implementation and the ephemeral one.

const DROP_TYPE = 'application/x-test'

// The consume() behaviour is swapped per test.
let consumeImpl: (input: Resource | Resource[]) => Promise<Resource | undefined>

const resultNode: Element = {
  id: 'result-1',
  type: 'test/result',
  class: 'block',
  children: [{ text: 'RESULT' }]
} as unknown as Element

const testConsumerPlugin: PluginDefinition = {
  class: 'block',
  name: 'test/dropee',
  componentEntry: {
    class: 'block',
    component: () => null
  },
  consumer: {
    consumes: ({ input }) => (input.type === DROP_TYPE ? [true, 'test/result', false] : [false]),
    consume: ({ input }) => consumeImpl(input)
  }
}

function makeEditor(): Editor {
  const editor = withHistory(createEditor())
  editor.children = [
    { id: 'p', type: 'core/text', class: 'text', properties: {}, children: [{ text: 'para' }] } as unknown as Descendant
  ]
  return editor
}

function dropEvent(type: string, data: string): React.DragEvent {
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    dataTransfer: {
      types: [type],
      items: [{ kind: 'string', type }],
      getData: (t: string) => (t === type ? data : '')
    }
  } as unknown as React.DragEvent
}

// The pipe fires consume() without awaiting; flush enough microtasks for the
// (synchronously-resolving) mock to settle and the follow-up inserts to run.
const flush = async () => {
  for (let i = 0; i < 5; i++) {
    await Promise.resolve()
  }
}

const types = (editor: Editor) => editor.children.map((n) => (n as Element).type)
const hasPlaceholder = (editor: Editor) => types(editor).includes('core/loader')

let warnSpy: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  warnSpy.mockRestore()
})

describe('pipeFromDrop — document contract (characterization)', () => {
  test('successful consume inserts the result at the drop position', async () => {
    consumeImpl = () => Promise.resolve({ type: 'test/result', data: resultNode })
    const editor = makeEditor()

    pipeFromDrop(editor, [testConsumerPlugin], dropEvent(DROP_TYPE, 'payload'), 1)
    await flush()

    expect(types(editor)).toEqual(['core/text', 'test/result'])
    expect(hasPlaceholder(editor)).toBe(false)
  })

  test('consume that throws leaves the document unchanged', async () => {
    consumeImpl = () => Promise.reject(new Error('boom'))
    const editor = makeEditor()

    pipeFromDrop(editor, [testConsumerPlugin], dropEvent(DROP_TYPE, 'payload'), 1)
    await flush()

    expect(types(editor)).toEqual(['core/text'])
    expect(hasPlaceholder(editor)).toBe(false)
  })

  test('consume that opts out (undefined) leaves the document unchanged', async () => {
    consumeImpl = () => Promise.resolve(undefined)
    const editor = makeEditor()

    pipeFromDrop(editor, [testConsumerPlugin], dropEvent(DROP_TYPE, 'payload'), 1)
    await flush()

    expect(types(editor)).toEqual(['core/text'])
    expect(hasPlaceholder(editor)).toBe(false)
  })

  test('consume returning the wrong produces type is discarded', async () => {
    consumeImpl = () => Promise.resolve({ type: 'wrong/type', data: resultNode })
    const editor = makeEditor()

    pipeFromDrop(editor, [testConsumerPlugin], dropEvent(DROP_TYPE, 'payload'), 1)
    await flush()

    expect(types(editor)).toEqual(['core/text'])
    expect(hasPlaceholder(editor)).toBe(false)
  })
})
