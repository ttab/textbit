import { Editor, Transforms } from 'slate'
import { useEffect, useRef } from 'react'
import { ReactEditor, useSlateStatic } from 'slate-react'
import { SlateEditableContainer } from './SlateEditableContainer'
import { useTextbit } from '../hooks/useTextbit'
import { DragStateProvider } from '../contexts/DragStateProvider'
import { PresenceOverlay } from './PresenceOverlay'

interface TextbitEditableProps {
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
  autoFocus?: boolean
  placeholder?: string
  dir?: 'ltr' | 'rtl'
  lang?: string
  onFocus?: React.FocusEventHandler<HTMLDivElement>
  onBlur?: React.FocusEventHandler<HTMLDivElement>
}

export function TextbitEditable(props: TextbitEditableProps): React.ReactElement {
  const editor = useSlateStatic()
  const ctx = useTextbit()

  // Auto focus
  const hasAutoFocusedRef = useRef(false)
  useEffect(() => {
    if (props.autoFocus && editor && !hasAutoFocusedRef.current) {
      hasAutoFocusedRef.current = true
      ReactEditor.focus(editor)

      // Move cursor to end
      Transforms.select(editor, Editor.end(editor, []))
    }
  }, [props.autoFocus, editor])

  return (
    <DragStateProvider>
      <PresenceOverlay isCollaborative={ctx?.collaborative}>
        <SlateEditableContainer
          placeholder={props?.placeholder}
          editor={editor}
          readOnly={ctx.readOnly}
          autoFocus={props.autoFocus}
          onFocus={props?.onFocus}
          onBlur={props?.onBlur}
          style={props?.style}
          className={props?.className}
        />
        {props.children}
      </PresenceOverlay>
    </DragStateProvider>
  )
}
