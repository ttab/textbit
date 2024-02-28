import React, {
  useLayoutEffect,
  useRef,
  PropsWithChildren,
  createContext,
  useState
} from 'react' // Necessary for esbuild
import { BaseSelection, Editor, Element, Node, NodeEntry, Range } from 'slate'

import { useSlateSelection, useSlateStatic } from 'slate-react'

type Position = {
  x: number
  y: number
  w: number
  h: number
}

type MetaData = {
  position: Position
  nodeEntry?: NodeEntry<Node>
  expanded: boolean
}

type PositionContextInterface = {
  position?: Position
  nodeEntry?: NodeEntry<Node>
  expanded: boolean
  inline: boolean
}

export const PositionContext = createContext<PositionContextInterface>({ inline: false, expanded: false })

export const PositionProvider = ({ inline = true, children }: PropsWithChildren & {
  inline: boolean
}) => {
  const [metaData, setMetaData] = useState<MetaData | undefined>(undefined)
  const selection = useSlateSelection()
  const editor = useSlateStatic()
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const nodeEntry = getSelectedInlineNode(editor, selection)
    const { top, left } = ref?.current?.getBoundingClientRect() || { top: 0, left: 0 }
    const domSelection = window.getSelection()

    if (domSelection && domSelection.type !== 'None') {
      const domRange = domSelection?.getRangeAt(0)
      const rect = domRange.getBoundingClientRect()

      setMetaData(!rect || !rect.width ? undefined : {
        position: {
          x: rect.left - left + (rect.width / 2),
          y: rect.top - top,
          w: rect.width,
          h: rect.height
        },
        nodeEntry,
        expanded: Range.isRange(selection) && Range.isExpanded(selection)
      })
    }
    else {
      setMetaData(undefined)
    }
  }, [selection])

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <PositionContext.Provider value={{
        inline,
        position: metaData?.position,
        nodeEntry: metaData?.nodeEntry,
        expanded: metaData?.expanded || false
      }}>
        {children}
      </PositionContext.Provider>
    </div>
  )
}

function getSelectedInlineNode(editor: Editor, selection: BaseSelection): NodeEntry<Node> | undefined {
  if (!selection) {
    return
  }

  const [nodeEntry] = Array.from(Editor.nodes(editor, {
    at: selection,
    match: n => Element.isElement(n) && n.class === 'inline'
  }))

  return nodeEntry
}
