import React, { // Necessary for esbuild
  PropsWithChildren,
  useMemo,
  useCallback
} from 'react'
import { createEditor, Editor as SlateEditor, Descendant, BaseEditor, Editor } from "slate"
import { HistoryEditor, withHistory } from "slate-history"
import { ReactEditor, RenderElementProps, RenderLeafProps, withReact } from "slate-react"
import { YHistoryEditor } from '@slate-yjs/core'

import { DragStateProvider } from './DragStateProvider'
import { withInline } from './with/inline'

import { ElementComponent } from './components/Element'
import { Leaf } from './components/Leaf'
import { withInsertText } from './with/insertText'
import { withNormalizeNode } from './with/normalizeNode'
import { withEditableVoids } from './with/editableVoids'
import { withInsertBreak } from './with/insertBreak'
import { withInsertHtml } from './with/insertHtml'
import { PresenceOverlay } from './components/PresenceOverlay/PresenceOverlay'
import { useTextbit } from '../TextbitRoot'
import { usePluginRegistry } from '../PluginRegistry'
import { PositionProvider } from '../ContextTools/PositionProvider'
import { Gutter } from '../GutterProvider'
import { SlateEditable } from './components/Slate/SlateEditable'
import { SlateSlate } from './components/Slate/SlateSlate'

export interface TextbitEditableProps extends PropsWithChildren {
  onChange?: (value: Descendant[]) => void
  value?: Descendant[]
  yjsEditor?: Editor
  gutter?: boolean
  dir?: 'ltr' | 'rtl'
  className?: string
}

export const TextbitEditable = ({
  children,
  value,
  onChange,
  yjsEditor,
  gutter = true,
  dir = 'ltr',
  className = ''
}: TextbitEditableProps) => {
  const { plugins, components, actions } = usePluginRegistry()
  const { autoFocus, onBlur, onFocus } = useTextbit()

  const textbitEditor = useMemo<BaseEditor & ReactEditor & HistoryEditor>(() => {
    const e = SlateEditor.isEditor(yjsEditor) ? yjsEditor : createEditor()

    if (!YHistoryEditor.isYHistoryEditor(e)) {
      withHistory(e)
    }
    withReact(e)

    withInline(e)
    withInsertText(e, plugins)
    withNormalizeNode(e, plugins, components)

    withEditableVoids(e, components)
    withInsertBreak(e, components)
    withInsertHtml(e, components, plugins)

    return e
  }, [])


  const renderSlateElement = useCallback((props: RenderElementProps) => {
    return ElementComponent(props)

  }, [])

  const renderLeafComponent = useCallback((props: RenderLeafProps) => {
    return Leaf(props)
  }, [])

  return (
    <DragStateProvider>
      <SlateSlate editor={textbitEditor} value={value} onChange={onChange}>
        <PositionProvider inline={true}>
          <Gutter.Provider dir={dir} gutter={gutter}>

            <Gutter.Content>
              <PresenceOverlay isCollaborative={!!yjsEditor}>
                <SlateEditable
                  className={className}
                  autoFocus={autoFocus}
                  onBlur={onBlur}
                  onFocus={onFocus}
                  renderSlateElement={renderSlateElement}
                  renderLeafComponent={renderLeafComponent}
                  textbitEditor={textbitEditor}
                  actions={actions}
                  components={components}
                />
              </PresenceOverlay>
            </Gutter.Content>

            {children}

          </Gutter.Provider>
        </PositionProvider>
      </SlateSlate>
    </DragStateProvider >
  )
}
