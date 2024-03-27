import React, { PropsWithChildren, useCallback, useEffect, useMemo } from 'react'
import { Descendant, Editor } from 'slate'
import { Slate } from 'slate-react'
import * as uuid from 'uuid'
import { useTextbit } from '../../../TextbitRoot'
import { calculateStats } from '@/lib'
import { debounce } from '@/lib/debounce'

/**
 * Wrapper around the Slate component handling value/onChange etc
 */
export const SlateSlate = ({ editor, value, onChange, children }: PropsWithChildren & {
  editor: Editor
  value?: Descendant[]
  onChange?: (value: Descendant[]) => void
}): JSX.Element => {
  const inValue = value || [{
    id: uuid.v4(),
    type: "core/text",
    class: "text",
    children: [{ text: "" }]
  }]

  const { dispatch, debounce: debounceTimeout } = useTextbit()

  // Initialize stats
  // FIXME: This does not work for yjs editors
  useEffect(() => {
    const [words, characters] = calculateStats(editor)
    dispatch({ words, characters })
  }, [editor])

  // Non debounce onChange handler
  const directOnChange = (value: Descendant[]) => {
    if (onChange) {
      onChange(value)
    }

    const [words, characters] = calculateStats(editor)
    dispatch({ words, characters })
  }

  // Debounce onChange handler
  const debouncedOnchange = useMemo(() => {
    return debounce((value: Descendant[]) => {
      directOnChange(value)
    }, debounceTimeout)
  }, [])

  // Handle onchange and use direct or debounced handler
  const handleOnChange = useCallback((value: Descendant[]) => {
    const isAstChange = editor.operations.some(
      op => 'set_selection' !== op.type
    )

    if (!isAstChange) {
      return
    }

    if (!debounceTimeout) {
      directOnChange(value)
    }
    else {
      debouncedOnchange(value)
    }
  }, [])

  return (
    <Slate
      editor={editor}
      initialValue={inValue}
      onChange={(value) => { handleOnChange(value) }}
    >
      {children}
    </Slate>
  )
}
