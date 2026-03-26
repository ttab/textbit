import { useCallback, useEffect, useRef, useState } from 'react'
import { Editor, Element, type NodeEntry, Range, Transforms } from 'slate'
import { Editable, ReactEditor, useFocused, type RenderElementProps, type RenderLeafProps } from 'slate-react'
import { getDecorationRanges } from '../../utils/getDecorationRanges'
import { ElementComponent } from '../Element/Element'
import { LeafElement } from '../Element/LeafElement'
import { usePluginRegistry } from '../../hooks/usePluginRegistry'
import { useTextbit } from '../../hooks/useTextbit'
import { useContextMenu } from '../../hooks/useContextMenu'
import { useSlateStatic } from 'slate-react'
import { DragStateProvider } from '../../contexts/DragStateProvider'
import { PresenceOverlay } from '../PresenceOverlay'
import type { SpellcheckLookupTable } from '../../types'
import { SelectionBoundsDetails } from '../SelectionBoundsDetails'
import { type AdjacentBlockState } from '../../contexts/AdjacentBlockContext'
import { AdjacentBlockProvider } from '../../contexts/AdjacentBlockProvider'
import { handleOnKeyDown } from './handleOnKeyDown/handleOnKeyDown'

interface TextbitEditableProps {
  autoFocus?: boolean | 'start' | 'end'
  onFocus?: React.FocusEventHandler<HTMLDivElement>
  onBlur?: React.FocusEventHandler<HTMLDivElement>
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
  'aria-label'?: string
}

export function TextbitEditable(props: TextbitEditableProps) {
  const editor = useSlateStatic()
  const { placeholders, placeholder, readOnly, dir, collaborative, verbose } = useTextbit()
  const { components, actions } = usePluginRegistry()
  const isFocused = useFocused()
  const [decorationsKey, setDecorationsKey] = useState(0)
  const handleContextMenu = useContextMenu()
  const [spellingLookupTable, setSpellingLookupTable] = useState<SpellcheckLookupTable>(new Map())
  const [adjacentBlock, setAdjacentBlock] = useState<AdjacentBlockState | null>(null)
  const { onFocus, autoFocus = false } = props

  // Track mounted state
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Focus the actual editable DOM node on mount
  const handleFocus = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    queueMicrotask(() => {
      if (!editor.selection && decorationsKey === 0) {
        if (autoFocus === 'end') {
          Transforms.select(editor, Editor.end(editor, []))
        } else {
          Transforms.select(editor, Editor.start(editor, []))
        }
        setDecorationsKey(prev => prev + 1)
      }
    })

    if (onFocus) {
      onFocus(e)
    }
  }, [autoFocus, decorationsKey, editor, onFocus])

  // Increment decorationkey to ensure re-render when spellcheck completes
  useEffect(() => {
    if (typeof editor.onSpellcheckComplete !== 'function') {
      return
    }

    editor.onSpellcheckComplete((newLookupTable) => {
      if (!isMountedRef.current) {
        console.log('Unmounted!')
        return
      }

      setSpellingLookupTable(newLookupTable)

      // HACK: Deselect and select the editor to ensure the dom selection is correctly updated.
      // FIXME: When https://github.com/ianstormtaylor/slate/issues/5987
      const selection = editor.selection
      ReactEditor.deselect(editor)
      setTimeout(() => {
        if (selection) {
          Transforms.select(editor, selection)
        }
      }, 10)
    })
  }, [editor, isFocused, setDecorationsKey])

  // Render element callback
  const renderElement = useCallback((props: RenderElementProps) => {
    return ElementComponent({
      ...props
    })
  }, [])

  // Render leaf callback
  const renderLeaf = useCallback((props: RenderLeafProps) => {
    return LeafElement(props)
  }, [])

  // Render decorate callback
  const decorate = useCallback((entry: NodeEntry) => {
    return getDecorationRanges(
      editor,
      spellingLookupTable,
      entry,
      components,
      placeholders,
      placeholder
    )
  }, [editor, components, placeholders, placeholder, spellingLookupTable])

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    handleOnKeyDown(editor, actions, event, adjacentBlock, setAdjacentBlock)
  }, [editor, actions, adjacentBlock, setAdjacentBlock])

  /**
   * Fixefox does not set the caret position correctly when clicking
   * in an unfocused Editable area. If the gecko rendering engine is
   * detected we help the user by setting the caret position.
   *
   * Also handles clicks in the horizontal gutter beside non-text blocks
   * by setting the adjacent block state instead of letting Slate try to
   * resolve a click position outside any editable text.
   */
  const onMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const clickX = event.clientX
    const clickY = event.clientY

    // Check if the click is horizontally beside a top-level non-text block
    for (let i = 0; i < editor.children.length; i++) {
      const block = editor.children[i]
      if (!Element.isElement(block) || block.class === 'text') continue

      let domNode: HTMLElement
      try {
        domNode = ReactEditor.toDOMNode(editor, block) as HTMLElement
      } catch {
        continue
      }

      const rect = domNode.getBoundingClientRect()
      if (clickY < rect.top || clickY > rect.bottom) continue
      if (clickX >= rect.left && clickX <= rect.right) continue // click is on the block itself

      event.preventDefault()
      ReactEditor.focus(editor)

      const direction: 'before' | 'after' = clickX < (rect.left + rect.right) / 2 ? 'before' : 'after'
      setAdjacentBlock({ blockId: block.id, direction })

      // Place Slate selection at the nearest text block neighbor (skip consecutive non-text blocks)
      // This mirrors keyboard navigation which never parks the selection inside a non-text block.
      if (direction === 'before') {
        let j = i - 1
        while (j >= 0 && Element.isElement(editor.children[j]) && editor.children[j].class !== 'text') j--
        if (j >= 0) Transforms.select(editor, Editor.end(editor, [j]))
      } else {
        let j = i + 1
        while (j < editor.children.length && Element.isElement(editor.children[j]) && editor.children[j].class !== 'text') j++
        if (j < editor.children.length) Transforms.select(editor, Editor.start(editor, [j]))
      }

      return
    }

    // Default: clear adjacent block state on any other click
    if (adjacentBlock) {
      setAdjacentBlock(null)
    }

    // We only need to handle this for Firefox (Gecko rendering engine)
    if (!navigator.userAgent.includes('Gecko/')) {
      return
    }

    if (!isFocused) {
      const range = ReactEditor.findEventRange(editor, event)
      if (Range.isRange(range)) {
        Transforms.select(editor, range)
      }
    }
  }, [editor, isFocused, adjacentBlock, setAdjacentBlock])

  return (
    <>
      <AdjacentBlockProvider value={adjacentBlock}>
        <DragStateProvider>
          <PresenceOverlay isCollaborative={collaborative}>
            <Editable
              autoFocus={!!autoFocus}
              data-state={isFocused ? 'focused' : ''}
              readOnly={readOnly}
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              onFocus={handleFocus}
              onBlur={props.onBlur}
              onKeyDown={onKeyDown}
              decorate={decorate}
              className={props.className}
              style={adjacentBlock
                ? { ...props.style, caretColor: 'transparent' }
                : props.style
              }
              spellCheck={false}
              dir={dir}
              onContextMenu={handleContextMenu}
              onMouseDown={onMouseDown}
              aria-label={props['aria-label']}
            />
            {props.children}
          </PresenceOverlay>
        </DragStateProvider>
      </AdjacentBlockProvider>

      {verbose && <SelectionBoundsDetails />}
    </>
  )
}
