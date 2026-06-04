import { type ChangeEvent } from 'react'
import { Editor, Transforms, Element } from 'slate'
import { HistoryEditor } from 'slate-history'
import { getSelectedNodeEntries } from './utils'
import type { PluginDefinition, Resource, ElementDefinition, ConsumeFunction } from '../types'
import { TextbitPlugin } from './textbit-plugin'

export type PipeConsumer = {
  name: string
  produces?: string
  aggregate: boolean
}

export type PipeItem = {
  kind: string
  type: string
  source: string
  input: File | string | null
  alternate?: string
  output?: Element | Element[]
  consumer: Array<PipeConsumer>
}

export type Pipe = Array<PipeItem>

export type AggregatedPipeItem = {
  consumer: Array<PipeConsumer> // All possible consumers for this pipe
  pipe: Array<PipeItem> // All data items
}

export type AggregatedPipe = Array<AggregatedPipeItem>


/**
 * Create and execute a consumer pipe from a file input change event
 */
export function pipeFromFileInput(editor: Editor, plugins: PluginDefinition[], e: ChangeEvent<HTMLInputElement>) {
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

  initConsumersForPipe(plugins, pipe)

  // TODO: Implement user choice of consumer when there are multiple consumers for items

  const aggregatedPipe = aggregateConsumersInPipe(pipe)

  let position = 0
  const entries = getSelectedNodeEntries(editor)
  if (entries) {
    const [, entry] = entries[entries.length - 1]
    position = entry[0] + 1
  } else {
    const nodes = Array.from(Editor.nodes(editor, {
      at: [0],
      match: (n) => {
        return (!Editor.isEditor(n) && Element.isElement(n))
      }
    }))
    position = nodes.length
  }

  executeAggregatedPipe(editor, aggregatedPipe, plugins, e, position)
}

/**
 * Create and execute a consumer pipe from a drop event
 */
export function pipeFromDrop(editor: Editor, plugins: PluginDefinition[], e: React.DragEvent, position: number) {
  const dt = e.dataTransfer
  const pipe = initPipeForDrop(dt)
  initConsumersForPipe(plugins, pipe)

  const aggregatedPipe = aggregateConsumersInPipe(pipe)

  // TODO: Implement user choice of consumer when there are multiple consumers for items

  executeAggregatedPipe(editor, aggregatedPipe, plugins, e, position)
}


function aggregateConsumersInPipe(origPipe: Pipe) {
  const aggregatedPipe: AggregatedPipe = []

  origPipe.forEach((origItem) => {
    const aggrItem = aggregatedPipe.find((aggrItem) => {
      return aggrItem.consumer.find((aggrConsumer) => !!origItem.consumer.find((origConsumer) => origConsumer.name === aggrConsumer.name))
    })

    if (!aggrItem) {
      aggregatedPipe.push({
        consumer: origItem.consumer,
        pipe: [origItem]
      })
    } else {
      origItem.consumer.forEach((origConsumer) => {
        if (!aggrItem.consumer.find((aggrConsumer) => aggrConsumer.name === origConsumer.name)) {
          aggrItem.consumer.push(origConsumer)
        }
      })
      aggrItem.pipe.push(origItem)
    }
  })

  return aggregatedPipe
}

function initConsumersForPipe(plugins: PluginDefinition[], pipe: Pipe) {
  for (const item of pipe) {
    const { source, type, input } = item

    plugins.forEach((plugin) => {
      if (!TextbitPlugin.isElementPlugin(plugin) || typeof plugin.consumer?.consumes !== 'function') {
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
    } else if (item.type === 'text/uri-list') {
      pipe.push(...geUriListItems('drop', dt, item, !handleTextPlain))
    } else if (item.type === 'text/html') {
      pipe.push(getHtmlItem('drop', dt, item, !handleTextPlain))
    } else if (item.type === 'text/plain') {
      if (handleTextPlain) {
        pipe.push(getDataItem('drop', dt, item))
      }
    } else {
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
async function executeAggregatedPipe(editor: Editor, aggregatedPipe: AggregatedPipe, plugins: PluginDefinition[], e: React.DragEvent | React.ChangeEvent, position: number) {
  if (aggregatedPipe.length) {
    e.preventDefault()
    e.stopPropagation()

    let offset = 0
    for (const pipe of aggregatedPipe) {
      const len = pipe.consumer.length

      if (len === 0) {
        if (pipe.pipe.find((pipeItem) => pipeItem.type === 'textbit/droppable-id')) {
          moveNode(editor, pipe.pipe[0].input as string, position)
        } else {
          const types = pipe.pipe.map((i) => i.type).join(', ')
          console.warn(`Ignored dropped data/files of type ${types}`)
        }
        continue
      }

      // FIXME: Should be aynchronous
      offset += await executePipe(pipe, editor, plugins, position, offset)
    }
  }
}

/**
 * Execute a pipe with items in an aggregated pipe
 */
async function executePipe(pipe: AggregatedPipeItem, editor: Editor, plugins: PluginDefinition[], position: number, offset: number): Promise<number> {
  const consumer = pipe.consumer[0] // Alternative consumers should have been removed previously
  const plugin = plugins.find((plugin): plugin is ElementDefinition => TextbitPlugin.isElementPlugin(plugin) && plugin.name === consumer.name)
  const consume = plugin?.consumer?.consume || undefined
  const produces = consumer?.produces

  if (!plugin || !consume) {
    console.warn(`Could not find plugin <${consumer.name}> or it's consume() function to handle pipe item from $(pipeItem.source})`)
    return 0
  }

  let localOffset = 0
  if (consumer.aggregate) {
    const input = pipe.pipe.map((p) => {
      return {
        source: p.source,
        type: p.type,
        data: p.input
      }
    })
    executePipeItem(consume, input, produces, editor, position + offset)
    localOffset++
  } else {
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

async function executePipeItem(consume: ConsumeFunction, input: Resource | Resource[], produces: string | undefined, editor: Editor, position: number) {
  // Track by id, not numeric position — the editor can mutate while `consume()` is awaiting.
  const loaderId = insertLoader(editor, position)

  let result: Resource | undefined
  try {
    result = await consume({ input, editor })
  } catch (ex) {
    console.warn((ex as Error).message)
    removeLoaderById(editor, loaderId)
    return
  }

  // `undefined` is the documented "consume() opted out" signal — no warn.
  if (result === undefined) {
    removeLoaderById(editor, loaderId)
    return
  }

  // Anything else that isn't the expected `{ type, data }` shape is a plugin bug.
  if (
    result === null
    || typeof result !== 'object'
    || result.type !== produces
    || result.data === undefined
  ) {
    console.warn(
      `consume(): unexpected result for "${produces}"; discarding.`,
      result
    )
    removeLoaderById(editor, loaderId)
    return
  }

  // The numeric drop position may have shifted while we awaited; locate the loader by id instead.
  const loaderPath = findTopLevelPathById(editor, loaderId)
  if (!loaderPath) {
    // The loader was removed externally (peer, manual edit, normalizer).
    // Rather than placing the result at a stale numeric position that may
    // now point at unrelated content, drop the result — the user can
    // retry deterministically.
    console.warn(
      `Drop loader for "${produces}" was removed before consume() resolved; dropping the consumed result.`
    )
    return
  }

  // Batch so the swap hits one normalize cycle and one yjs sync. Loader
  // removal stays out of history; the real insert remains undoable.
  const data = result.data
  Editor.withoutNormalizing(editor, () => {
    HistoryEditor.withoutSaving(editor, () => {
      Transforms.removeNodes(editor, { at: loaderPath })
    })
    Transforms.insertNodes(editor, data as Element, { at: loaderPath, select: false })
  })
}

function removeLoaderById(editor: Editor, loaderId: string) {
  const path = findTopLevelPathById(editor, loaderId)
  if (path) {
    HistoryEditor.withoutSaving(editor, () => {
      Transforms.removeNodes(editor, { at: path })
    })
  }
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

  for (const line of data.split('\r\n')) {
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
  const id = crypto.randomUUID()

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

/**
 * Find the top-level path of an element by its id. Returns null when no
 * top-level child carries that id. Used by the pipe machinery to locate
 * loader placeholders after `await consume()` may have left numeric
 * positions stale.
 */
export function findTopLevelPathById(editor: Editor, id: string): [number] | null {
  for (let i = 0; i < editor.children.length; i++) {
    const child = editor.children[i]
    if (Element.isElement(child) && child.id === id) {
      return [i]
    }
  }
  return null
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
