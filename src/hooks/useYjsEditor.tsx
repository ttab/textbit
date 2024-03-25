import { useEffect, useMemo } from 'react'
import { createEditor, Editor } from 'slate'
import { WithCursorsOptions, YjsEditor, withCursors, withYHistory, withYjs } from '@slate-yjs/core'
import { Awareness } from 'y-protocols/awareness'
import * as Y from 'yjs'

interface YjsEditorOptions {
  sharedRoot?: Y.XmlText
  awareness?: Awareness
  cursorOptions?: WithCursorsOptions
}

export function useYjsEditor({ sharedRoot, awareness, cursorOptions }: YjsEditorOptions): Editor | undefined {
  const yjsEditor = useMemo(() => {
    if (!sharedRoot) {
      return
    }

    const editor = withYjs(createEditor(), sharedRoot)

    if (!awareness || !cursorOptions) {
      return withYHistory(editor)
    }

    return withYHistory(
      withCursors(editor, awareness, cursorOptions)
    )
  }, [sharedRoot, awareness, cursorOptions])

  useEffect(() => {
    if (yjsEditor) {
      YjsEditor.connect(yjsEditor)
      return () => YjsEditor.disconnect(yjsEditor)
    }
  }, [yjsEditor])

  return yjsEditor
}
