import { Editor, Transforms, Range, Path, Element, Node } from "slate"
import * as uuid from 'uuid'
import { componentConstraints } from "./componentConstraints"
import { Registry } from "src/components/editor/registry"
import { TextbitEditor } from "./textbit-editor"
import { ConsumeFunction, ConsumerInput, ConsumesFunction } from "src/types"

type Consumers = {
  consumes: ConsumesFunction
  consume: ConsumeFunction
}[]

export function pasteToConsumers(editor: Editor, consumers: Consumers, input: ConsumerInput): false | Promise<string | void> {
  const [consume, output] = findConsumer(consumers, input)

  if (typeof consume !== 'function') {
    return false
  }

  return new Promise((resolve) => {
    consume({ input, editor }).then((result) => {
      if (typeof result === 'object' && output === result.type) {
        insertNodes(editor, result)
        resolve() // It is handled
      }
      else if (typeof result === 'string' && output === 'text/plain') {
        resolve(result) // It is transformed to text, handle it further
      }
      else {
        console.warn(`Unexpected output from consumer when handling paste, expected ${output}`, result)
        resolve()
      }
    })
  })
}


function findConsumer(consumers: Consumers, input: ConsumerInput) {
  for (const consumer of consumers) {

    const [accept, output] = consumer?.consumes({ input }) || [false]

    if (accept) {
      return [consumer.consume, output]
    }
  }

  return [undefined, undefined]
}

function insertNodes(editor: Editor, object: any) {
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
  }
  else {
    // When not touching current node, put it after current node
    at++
  }

  Transforms.insertNodes(
    editor,
    object,
    { at: [at], select: true }
  )
}