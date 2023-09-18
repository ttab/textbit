import { Editor, Transforms, Element } from "slate"
import { Registry } from "../components/editor/registry"
import { HistoryEditor } from "slate-history"
import * as uuid from 'uuid'
import { getNodeById } from "./utils"

export type PipeConsumer = {
  name: string,
  produces: string,
  aggregate: boolean
}

export type PipeItem = {
  kind: string,
  type: string,
  source: string,
  data: File | string,
  consumer: Array<PipeConsumer>
}

export type Pipe = Array<PipeItem>

export type AggregatedPipeItem = {
  consumer: Array<PipeConsumer>, // All possible consumers for this pipe
  pipe: Array<PipeItem> // All data items
}

export type AggregatedPipe = Array<AggregatedPipeItem>


export function assemblePipeForDrop(dt: DataTransfer) {
  const pipe = initPipeForDrop(dt)
  initConsumersForPipe(pipe)

  const aggregatedPipe = aggregateConsumersInPipe(pipe)

  return aggregatedPipe
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

function initConsumersForPipe(pipe: any[]) {
  for (const item of pipe) {
    const { source, type, data } = item

    const speculators = Registry.plugins.filter(plugin => {
      if (typeof plugin.consumer?.consumes !== 'function') {
        return false
      }

      const [match, produces = undefined, aggregate = false] = plugin.consumer.consumes({ source, type, data })
      if (match === true) {
        item.consumer.push({
          name: plugin.name,
          produces,
          aggregate
        })
      }
    })
  }
}

function initPipeForDrop(dt: DataTransfer) {
  const pipe = [] //new Map()
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

export async function executeAggregatedPipe(aggregatedPipe: AggregatedPipe, e: React.DragEvent<HTMLDivElement>, editor: Editor, position: number) {
  if (aggregatedPipe.length) {
    e.preventDefault()
    e.stopPropagation()

    for (const pipe of aggregatedPipe) {
      const len = pipe.consumer.length

      if (len === 0) {
        if (pipe.pipe.find(pipeItem => pipeItem.type === 'mimer/droppable-id')) {
          moveNode(editor, pipe.pipe[0].data as string, position)
        }
        else {
          const types = pipe.pipe.map(i => i.type).join(', ')
          console.warn('Ignored dropped data/files of type ${types}')
          continue
        }
      }

      if (pipe.consumer.length > 1) {
        // TODO: Implement choice of handler
        // Now just use first one [0]
      }
      const consumer = pipe.consumer[0]

      const plugin = Registry.plugins.find(plugin => plugin.name === consumer.name)

      if (consumer.aggregate) {
        const pipeItems = pipe.pipe.map(p => {
          return {
            source: p.source,
            type: p.type,
            data: p.data
          }
        })
        plugin?.consumer?.consume({ data: pipeItems })
      }
      else {
        for (const pipeItem of pipe.pipe) {
          plugin?.consumer?.consume({
            data: {
              source: pipeItem.source,
              type: pipeItem.type,
              data: pipeItem.data
            }
          })
        }
      }
    }
  }
}

function getDataItem(source: string, dt: DataTransfer, item: DataTransferItem) {
  return {
    kind: item.kind,
    type: item.type,
    source,
    data: dt.getData(item.type),
    consumer: [],
    output: undefined
  }
}

function getHtmlItem(source: string, dt: DataTransfer, item: DataTransferItem, hasTextFallback: boolean) {
  return {
    kind: item.kind,
    type: item.type,
    source,
    data: dt.getData(item.type),
    alternate: hasTextFallback ? dt.getData('text/plain') : undefined,
    consumer: [],
    output: undefined
  }
}

function getFileItem(source: string, item: DataTransferItem) {
  return {
    kind: item.kind,
    type: item.type,
    source,
    data: item.getAsFile(),
    consumer: [],
    output: undefined
  }
}

function geUriListItems(source: string, dt: DataTransfer, item: DataTransferItem, hasTextFallback: boolean) {
  const data = dt.getData(item.type)
  const items: any[] = []
  const alternate = hasTextFallback ? dt.getData('text/plain') : undefined

  for (const line of data.split("\r\n")) {
    items.push({
      kind: item.kind,
      type: item.type,
      source,
      data: line,
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


async function handleFileDrop(
  editor: Editor,
  position: number,
  consumers: Array<{
    consume: Function,
    files: File[],
    bulk: boolean
  }>
) {
  if (!HistoryEditor.isHistoryEditor(editor)) {
    throw new Error('Editor is not a history editor. Unexpected weirdness is going on!')
  }

  for (const { files, bulk } of consumers) {
    if (bulk) {
      insertLoader(editor, position)
    }
    else {
      files.forEach(() => insertLoader(editor, position))
    }
  }

  try {
    let offset = 0
    for (const { consume, files, bulk } of consumers) {
      const result = await consume({ data: files })

      Transforms.insertNodes(
        editor, result, { at: [position + offset], select: false }
      )

      if (bulk) {
        offset++
        removeLoader(editor, position + offset)
      }
      else {
        offset += files.length
        files.forEach(() => {
          removeLoader(editor, position + offset)
        })
      }
    }
  }
  catch (error: any) {
    if (typeof error === 'string') {
      console.error(error)
    }
    else if (error.message) {
      console.error(error.messsage)
    }
    else {
      console.error('Unknown error on drop')
    }
  }
}