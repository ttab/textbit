import type { PlaceholdersVisibility } from '../contexts/TextbitContext'
import type { PluginDefinition, SpellingError } from '../types'
import type { Awareness } from 'y-protocols/awareness'

import { createEditor, Descendant, type Editor, Node } from 'slate'
import * as Y from 'yjs'
import { Slate, withReact } from 'slate-react'
import { usePluginRegistry, useTextbit } from '../main'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { calculateStats } from '../utils/calculateStats'
import { debounce as debounceCall } from '../utils/debounce'
import { withCursors, withYHistory, withYjs, YjsEditor } from '@slate-yjs/core'
import { withHistory } from 'slate-history'
import { withLang } from '../with/withLang'
import { withSpeling } from '../with/withSpeling'
import { withTextbitElements } from '../with/withTextbitElements'
import { withInsertText } from '../with/withInsertText'
import { withNormalizeNode } from '../with/withNormalizeNode'
import { withEditableVoids } from '../with/withEditableVoids'
import { withInsertBreak } from '../with/withInsertBreak'
import { withInsertHtml } from '../with/withInsertHtml'
import { withUniqueIds } from '../with/withUniqueIds'
import { withDeletionManagement } from '../with/withDeletionManagement'

interface SlateContainerBaseProps {
  children: React.ReactNode
  verbose?: boolean
  readOnly?: boolean
  debounce?: number
  spellcheckDebounce?: number
  placeholders?: PlaceholdersVisibility
  plugins?: PluginDefinition[]
  className?: string
  style?: React.CSSProperties
  onSpellcheck?: (texts: { lang: string, text: string }[]) => Promise<Omit<SpellingError, 'id'>[][]>
}

interface SlateContainerStringProps extends SlateContainerBaseProps {
  value: string
  onChange?: (value: string) => void
}
interface SlateContainerDefaultProps extends SlateContainerBaseProps {
  value: Descendant[]
  onChange?: (value: Descendant[]) => void
}
interface SlateContainerCollaborationProps extends SlateContainerBaseProps {
  value: Y.XmlText
  awareness?: Awareness
  cursor?: {
    stateField?: string
    dataField?: string
    autoSend?: boolean
    data: Record<string, unknown>
  }
  onChange?: undefined
}
type SlateContainerProps = SlateContainerStringProps | SlateContainerDefaultProps | SlateContainerCollaborationProps

export function SlateContainer(props: SlateContainerStringProps): React.ReactElement
export function SlateContainer(props: SlateContainerDefaultProps): React.ReactElement
export function SlateContainer(props: SlateContainerCollaborationProps): React.ReactElement
export function SlateContainer(props: SlateContainerProps) {
  const { children, value, readOnly } = props
  const { debounce, spellcheckDebounce, dispatch, lang } = useTextbit()
  const { plugins, components } = usePluginRegistry()

  // Preserve editor across HMR
  const editorRef = useRef<Editor | null>(null)

  // Force re-render on initial spellcheck only
  const [spellcheckKey, setSpellcheckKey] = useState(0)

  if (!editorRef.current) {
    let editor = withReact(createEditor())

    if (isSlateContainerCollaborationProps(props)) {
      // Create collaborative editor with proper plugin chain
      editor = withYHistory(withYjs(editor, props.value))

      // Add cursors if awareness is provided
      if (props.awareness && YjsEditor.isYjsEditor(editor)) {
        editor = withCursors(editor, props.awareness, {
          autoSend: props.cursor?.autoSend ?? true,
          data: props.cursor?.data ?? {},
          cursorStateField: props.cursor?.stateField,
          cursorDataField: props.cursor?.dataField
        })
      }
    } else {
      editor = withHistory(editor)
    }

    withLang(editor, lang)
    if (props.onSpellcheck) {
      withSpeling(editor, props.onSpellcheck, spellcheckDebounce)
    }
    withTextbitElements(editor)
    withInsertText(editor, plugins)
    withNormalizeNode(editor, plugins, components)
    withEditableVoids(editor, components)
    withInsertBreak(editor, components)
    withInsertHtml(editor, components, plugins)
    withUniqueIds(editor)
    withDeletionManagement(editor)

    editor.onUpdatedDecorations = () => {
      // Trigger an immediate rerender to show updated decorations
      setSpellcheckKey(v => v + 1)
    }
    editorRef.current = editor
  }

  const editor = editorRef.current

  useEffect(() => {
    if (YjsEditor.isYjsEditor(editor)) {
      YjsEditor.connect(editor)
      return () => YjsEditor.disconnect(editor)
    }
  }, [editor])

  // Initialize the editor with the provided value.
  const initialValue = useMemo(() => {
    if (value instanceof Y.XmlText) {
      return [] // Empty initial value for yjs editor
    } else if (typeof value === 'string') {
      return stringToDescentant(value)
    } else {
      return value
    }
  }, [value])

  // Debounced onChange callback
  const handleChange = useCallback((newValue: Descendant[]) => {
    if (props.onChange) {
      if (isSlateContainerDefaultProps(props)) {
        props.onChange(newValue)
      } else if (isSlateContainerStringProps(props)) {
        props.onChange(newValue
          .map(node => Node.string(node))
          .join('\n'))
      }
    }

    // Update stats
    dispatch({ stats: calculateStats(editor) })

    // Specifically only depend on onChange, value and dispatch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.onChange, props.value, dispatch])

  // Debounced onChange callback
  const onChangeCallback = useMemo(
    () => readOnly ? () => { } : debounceCall(handleChange, debounce || 1250),
    [handleChange, readOnly, debounce]
  )

  // Initialize spellcheck and stats
  useEffect(() => {
    editor.spellcheck?.()
    dispatch({ stats: calculateStats(editor) })
  }, [editor, dispatch])

  return (
    <Slate editor={editor} initialValue={initialValue} onChange={onChangeCallback}>
      <div key={spellcheckKey}>
        {children}
      </div>
    </Slate>
  )
}

function stringToDescentant(value: string): Descendant[] {
  return value.split('\n').map((text) => {
    return {
      id: crypto.randomUUID(),
      type: 'core/text',
      class: 'text',
      children: [{ text }]
    }
  })
}

function isSlateContainerCollaborationProps(
  props: SlateContainerProps
): props is SlateContainerCollaborationProps {
  return 'awareness' in props && 'cursor' in props
}

function isSlateContainerStringProps(
  props: SlateContainerProps
): props is SlateContainerStringProps {
  return typeof props.value === 'string'
}

function isSlateContainerDefaultProps(
  props: SlateContainerProps
): props is SlateContainerDefaultProps {
  return !isSlateContainerCollaborationProps(props) && !isSlateContainerStringProps(props)
}
