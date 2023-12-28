import { Editor, Transforms, Element } from "slate"
import { Registry } from "../components/Registry"
import { HistoryEditor } from "slate-history"
import * as uuid from 'uuid'
import { getNodeById, getSelectedNodeEntries } from "./utils"
import { TBConsumeFunction, TBConsumerInput } from "../types/types"
import { ChangeEvent } from "react"

export type PipeConsumer = {
  name: string,
  produces?: string,
  aggregate: boolean
}

export type PipeItem = {
  kind: string,
  type: string,
  source: string,
  input: File | string | null,
  alternate?: string
  output?: Element | Element[]
  consumer: Array<PipeConsumer>
}

export type Pipe = Array<PipeItem>

export type AggregatedPipeItem = {
  consumer: Array<PipeConsumer>, // All possible consumers for this pipe
  pipe: Array<PipeItem> // All data items
}

export type AggregatedPipe = Array<AggregatedPipeItem>


/**
 * Create and execute a consumer pipe from a file input change event
 */
export function pipeFromFileInput(editor: Editor, e: ChangeEvent<HTMLInputElement>) {
  const pipe = []
  const files = e.target.files

  if (!files) {
    return
  }

  for (const file of files) {
    const item = {
      kind: 'file',
      type: file.type,
      name: file.name,
      source: 'fileinput',
      input: file,
      consumer: [],
      output: undefined
    }
    pipe.push(item)
  }

  initConsumersForPipe(pipe)

  // TODO: Implement user choice of consumer when there are multiple consumers for items

  const aggregatedPipe = aggregateConsumersInPipe(pipe)

  let position = 0
  const entries = getSelectedNodeEntries(editor)
  if (entries) {
    const [node, entry] = entries[entries.length - 1]
    position = entry[0] + 1
  }
  else {
    const nodes = Array.from(Editor.nodes(editor, {
      at: [0],
      match: n => {
        return (!Editor.isEditor(n) && Element.isElement(n))
      }
    }))
    position = nodes.length
  }

  executeAggregatedPipe(aggregatedPipe, e, editor, position)
}

/**
 * Create and execute a consumer pipe from a drop event
 */
export function pipeFromDrop(editor: Editor, e: React.DragEvent, position: number) {
  const dt = e.dataTransfer
  const pipe = initPipeForDrop(dt)
  initConsumersForPipe(pipe)

  const aggregatedPipe = aggregateConsumersInPipe(pipe)

  // TODO: Implement user choice of consumer when there are multiple consumers for items

  executeAggregatedPipe(aggregatedPipe, e, editor, position)
}


function aggregateConsumersInPipe(origPipe: Pipe) {
  const aggregatedPipe: AggregatedPipe = []

  origPipe.forEach(origItem => {
    const aggrItem = aggregatedPipe.find(aggrItem => {
      return aggrItem.consumer.find(aggrConsumer => !!origItem.consumer.find(origConsumer => origConsumer.name === aggrConsumer.name))
    })

    if (!aggrItem) {
      aggregatedPipe.push({
        consumer: origItem.consumer,
        pipe: [origItem]
      })
    }
    else {
      origItem.consumer.forEach(origConsumer => {
        if (!aggrItem.consumer.find(aggrConsumer => aggrConsumer.name === origConsumer.name)) {
          aggrItem.consumer.push(origConsumer)
        }
      })
      aggrItem.pipe.push(origItem)
    }
  })

  return aggregatedPipe
}

function initConsumersForPipe(pipe: Pipe) {
  for (const item of pipe) {
    const { source, type, input } = item

    Registry.plugins.forEach(plugin => {
      if (typeof plugin.consumer?.consumes !== 'function') {
        return false
      }

      const [match, produces = undefined, aggregate = false] = plugin.consumer.consumes({
        input: {
          source,
          type,
          data: input
        }
      })

      if (match === true) {
        item.consumer.push({
          name: plugin.name,
          produces: produces || undefined,
          aggregate
        })
      }
    })
  }
}

function initPipeForDrop(dt: DataTransfer) {
  const pipe = []
  let handleTextPlain = true

  // Add text/plain as "alternate" data with uri-list and html drop data types
  if (dt.types.includes('text/plain')) {
    if (dt.types.includes('text/uri-list') || dt.types.includes('text/html')) {
      handleTextPlain = false
    }
  }

  for (let i = 0; i < dt.items.length; i++) {
    const item = dt.items[i]

    if (item.kind === 'file') {
      pipe.push(getFileItem('drop', item))
    }
    else if (item.type === 'text/uri-list') {
      pipe.push(...geUriListItems('drop', dt, item, !handleTextPlain))
    }
    else if (item.type === 'text/html') {
      pipe.push(getHtmlItem('drop', dt, item, !handleTextPlain))
    }
    else if (item.type === 'text/plain') {
      if (handleTextPlain) {
        pipe.push(getDataItem('drop', dt, item))
      }
    }
    else {
      pipe.push(getDataItem('drop', dt, item))
    }
  }

  return pipe
}

/**
 * Loop over an aggregated pipe (of pipes) and execute the individual pipes
 *
 * +---+    +---+---+---+---+
 * | 1 | -> | a | b | c | d |
 * +---+    +---+---+---+---+
 * +---+    +---+
 * | 2 | -> | e |
 * +---+    +---+
 * +---+    +---+---+
 * | 3 | -> | f | i |
 * +---+    +---+---+
 *   ^
 */
async function executeAggregatedPipe(aggregatedPipe: AggregatedPipe, e: React.DragEvent | React.ChangeEvent, editor: Editor, position: number) {
  if (aggregatedPipe.length) {
    e.preventDefault()
    e.stopPropagation()

    let offset = 0
    for (const pipe of aggregatedPipe) {
      const len = pipe.consumer.length

      if (len === 0) {
        if (pipe.pipe.find(pipeItem => pipeItem.type === 'textbit/droppable-id')) {
          moveNode(editor, pipe.pipe[0].input as string, position)
        }
        else {
          const types = pipe.pipe.map(i => i.type).join(', ')
          console.warn(`Ignored dropped data/files of type ${types}`)
        }
        continue
      }

      // FIXME: Should be aynchronous
      offset += await executePipe(pipe, editor, position, offset)
    }
  }
}

/**
 * Execute a pipe with items in an aggregated pipe
 */
async function executePipe(pipe: AggregatedPipeItem, editor: Editor, position: number, offset: number): Promise<number> {
  const consumer = pipe.consumer[0] // Alternative consumers should have been removed previously
  const plugin = Registry.plugins.find(plugin => plugin.name === consumer.name)
  const consume = plugin?.consumer?.consume || undefined
  const produces = consumer?.produces

  if (!plugin || !consume) {
    console.warn(`Could not find plugin <${consumer.name}> or it's consume() function to handle pipe item from $(pipeItem.source})`)
    return 0
  }

  let localOffset = 0
  if (consumer.aggregate) {
    const input = pipe.pipe.map(p => {
      return {
        source: p.source,
        type: p.type,
        data: p.input
      }
    })
    executePipeItem(consume, input, produces, editor, position + offset)
    localOffset++
  }
  else {
    for (const pipeItem of pipe.pipe) {
      const input = {
        source: pipeItem.source,
        type: pipeItem.type,
        data: pipeItem.input
      }
      executePipeItem(consume, input, produces, editor, position + offset + localOffset)
      localOffset++
    }
  }

  return localOffset
}

async function executePipeItem(consume: TBConsumeFunction, input: TBConsumerInput | TBConsumerInput[], produces: string | undefined, editor: Editor, position: number) {
  insertLoader(editor, position)
  let offset = 0

  try {
    const result = await consume({ input, editor })
    if (typeof result === 'object' && produces === result?.type) {
      Transforms.insertNodes(
        editor, result, { at: [position], select: false }
      )
      offset++
    }
  }
  catch (ex: any) {
    console.warn(ex.message)
  }

  removeLoader(editor, position + offset)
}

function getDataItem(source: string, dt: DataTransfer, item: DataTransferItem) {
  return {
    kind: item.kind,
    type: item.type,
    source,
    input: dt.getData(item.type),
    consumer: [],
    output: undefined
  }
}

function getHtmlItem(source: string, dt: DataTransfer, item: DataTransferItem, hasTextFallback: boolean) {
  return {
    kind: item.kind,
    type: item.type,
    source,
    input: dt.getData(item.type),
    alternate: hasTextFallback ? dt.getData('text/plain') : undefined,
    consumer: [],
    output: undefined
  }
}

function getFileItem(source: string, item: DataTransferItem): PipeItem {
  return {
    kind: item.kind,
    type: item.type,
    source,
    input: item.getAsFile(),
    consumer: [],
    output: undefined
  }
}

function geUriListItems(source: string, dt: DataTransfer, item: DataTransferItem, hasTextFallback: boolean): PipeItem[] {
  const data = dt.getData(item.type)
  const items: PipeItem[] = []
  const alternate = hasTextFallback ? dt.getData('text/plain') : undefined

  for (const line of data.split("\r\n")) {
    items.push({
      kind: item.kind,
      type: item.type,
      source,
      input: line,
      alternate,
      consumer: [],
      output: undefined
    })
  }

  return items
}

function insertLoader(editor: Editor, position: number) {
  const id = uuid.v4()

  HistoryEditor.withoutSaving(editor, () => {
    Transforms.insertNodes(
      editor,
      [{
        id,
        class: 'void',
        type: 'core/loader',
        properties: {},
        children: [{ text: '' }]
      }],
      {
        at: [position],
        select: false
      }
    )
  })

  return id
}

function removeLoader(editor: Editor, identifier: string | number) {
  let position: number

  if (typeof identifier === 'number') {
    position = identifier
  }
  else if (typeof identifier === 'string') {
    const node = getNodeById(editor, identifier)
  }
  else {
    console.warn('Could not remove loader, identifier was neither number or string')
    return
  }

  HistoryEditor.withoutSaving(editor, () => {
    Transforms.removeNodes(editor, { at: [position] })
  })
}


function moveNode(editor: Editor, id: string, to: number) {
  let from: number = 0
  let node: Element | undefined = undefined

  // FIXME: Should use getNodeById() in utils
  for (const child of editor.children) {
    if (Element.isElement(child) && child.id === id) {
      node = child
      break
    }
    from++
  }

  if (!node) {
    return
  }

  Transforms.moveNodes(editor, { at: [from], to: [to] })
}
