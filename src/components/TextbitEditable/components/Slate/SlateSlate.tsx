import React, { PropsWithChildren, useCallback, useEffect } from 'react'
import { Descendant, Editor } from 'slate'
import { Slate } from 'slate-react'
import * as uuid from 'uuid'
import { useTextbit } from '../../../TextbitRoot'
import { calculateStats } from '@/lib'

/**
 * Wrapper around the Slate component handling value/onChange etc
 */
export const SlateSlate = ({ editor, value, onChange, onSpellcheck, children }: PropsWithChildren & {
  editor: Editor
  value?: Descendant[]
  onChange?: (value: Descendant[]) => void
  onSpellcheck: () => void
}): JSX.Element => {
  const inValue = value || [{
    id: uuid.v4(),
    type: "core/text",
    class: "text",
    children: [{ text: "" }]
  }]

  const {
    dispatch,
    debounce: debounceTimeout,
    spellcheckDebounce: spellcheckDebounceTimeout
  } = useTextbit()

  // Initialize stats
  // FIXME: This does not work for yjs editors
  useEffect(() => {
    const [words, characters] = calculateStats(editor)
    dispatch({ words, characters })
  }, [editor])

  return (
    <Slate
      editor={editor}
      initialValue={inValue}
      onChange={(value) => {
        if (!editor.operations.some(op => 'set_selection' !== op.type)) {
          return
        }

        if (onChange) {
          onChange(value)
        }

        if (onSpellcheck) {
          onSpellcheck()
        }
      }}
    >
      {children}
    </Slate>
  )
}
