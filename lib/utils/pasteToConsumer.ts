import { Editor, Transforms, Range, Element, Node } from 'slate'
import type { Resource, ConsumesFunction, ConsumeFunction } from '../types'

type Consumers = {
  consumes: ConsumesFunction
  consume: ConsumeFunction
}[]

export function pasteToConsumers(editor: Editor, consumers: Consumers, input: Resource): false | Promise<string | void> {
  const [consume, output] = findConsumer(consumers, input)

  if (typeof consume !== 'function') {
    return false
  }

  return new Promise((resolve) => {
    void consume({ input, editor }).then((result) => {
      if (typeof result?.data === 'object' && output === result.type) {
        insertNodes(editor, result.data as Element)
        resolve() // It is handled
      } else if (typeof result?.data === 'string' && output === 'text/plain') {
        resolve(result?.data) // It is transformed to text, handle it further
      } else {
        console.warn(`Unexpected output from consumer when handling paste`, result)
        resolve()
      }
    })
  })
}


function findConsumer(consumers: Consumers, input: Resource) {
  for (const consumer of consumers) {
    const [accept, output] = consumer?.consumes({ input }) || [false]

    if (accept) {
      return [consumer.consume, output]
    }
  }

  return [undefined, undefined]
}

function insertNodes(editor: Editor, object: Element) {
  if (!Range.isRange(editor.selection)) {
    return
  }

  const range = Editor.unhangRange(editor, editor.selection)
  let at = (range && range.anchor.path[0] > 0) ? range.anchor.path[0] : 0
  const node = Node.get(editor, [at])

  if (!Element.isElement(node)) {
    return
  }

  if (node?.class === 'text' && Editor.string(editor, [at]) === '') {
    // This highest level node is a text node and is empty, remove it
    Transforms.removeNodes(editor, { at: [at] })
  } else {
    // When not touching current node, put it after current node
    at++
  }

  Transforms.insertNodes(
    editor,
    object,
    { at: [at], select: true }
  )
}
