import React, { // Necessary for esbuild
  PropsWithChildren,
  useEffect,
  useMemo,
  useCallback
} from 'react'
import { createEditor, Editor as SlateEditor, Descendant, BaseEditor } from "slate"
import { HistoryEditor, withHistory } from "slate-history"
import { ReactEditor, RenderElementProps, RenderLeafProps, withReact } from "slate-react"
import { WithCursorsOptions, YHistoryEditor } from '@slate-yjs/core'

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
import { Awareness } from 'y-protocols/awareness'
import * as Y from 'yjs'
import { SlateEditable } from './components/Slate/SlateEditable'
import { SlateSlate } from './components/Slate/SlateSlate'
import { useYjsEditor } from '@/hooks'

interface TextbitEditableProps extends PropsWithChildren {
  onChange?: (value: Descendant[]) => void
  value?: Descendant[]
  gutter?: boolean // FIXME: This might not be used no longer
  dir?: 'ltr' | 'rtl'
  className?: string
  sharedRoot?: Y.XmlText
  awareness?: Awareness
  cursorOptions?: WithCursorsOptions
}

interface TextbitEditableBaseProps extends PropsWithChildren {
  onChange: (value: Descendant[]) => void
  value: Descendant[]
}

interface TextbitEditableYjsProps extends PropsWithChildren {
  sharedRoot: Y.XmlText
}

interface TextbitEditableYjsAwarenessProps extends PropsWithChildren {
  sharedRoot: Y.XmlText
  awareness: Awareness
  cursorOptions: WithCursorsOptions
}

export const TextbitEditable = ({
  children,
  value,
  onChange,
  sharedRoot,
  awareness,
  cursorOptions,
  gutter = true,
  dir = 'ltr',
  className = ''
}:
  TextbitEditableProps & (TextbitEditableBaseProps | TextbitEditableYjsProps | TextbitEditableYjsAwarenessProps)
) => {
  const yjsEditor = useYjsEditor({ sharedRoot, awareness, cursorOptions })
  const { placeholders } = useTextbit()
  const { plugins, components, actions } = usePluginRegistry()

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
              <PresenceOverlay isCollaborative={!!awareness}>
                <SlateEditable
                  className={className}
                  renderSlateElement={renderSlateElement}
                  renderLeafComponent={renderLeafComponent}
                  textbitEditor={textbitEditor}
                  actions={actions}
                  components={components}
                  displayPlaceholders={placeholders}
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
