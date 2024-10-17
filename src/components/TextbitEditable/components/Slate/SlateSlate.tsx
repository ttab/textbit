import React, { PropsWithChildren, useCallback, useEffect } from 'react'
import { Descendant, Editor } from 'slate'
import { Slate } from 'slate-react'
import * as uuid from 'uuid'
import { useTextbit } from '../../../TextbitRoot'
import { calculateStats } from '@/lib'
import { debounce } from '@/lib/debounce'
import { getTextNodesInTopAncestor } from '@/lib/utils'
import { TBText } from '@/types'

/**
 * Wrapper around the Slate component handling value/onChange etc
 */
export const SlateSlate = ({ editor, value, onChange, onSpellcheck, children }: PropsWithChildren & {
  editor: Editor
  value?: Descendant[]
  onChange?: (value: Descendant[]) => void
  onSpellcheck?: (texts: string[]) => Array<{
    str: string,
    pos: number,
    sub: string[]
  }[]>
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


  // Debounce onChange handler
  const onChangeCallback = useCallback(
    debounce((value: Descendant[]) => {
      if (onChange) {
        onChange(value)
      }

      const [words, characters] = calculateStats(editor)
      dispatch({ words, characters })
    }, debounceTimeout),
    [editor, onChange, debounceTimeout]
  )

  // Debounce onSpellcheck handler
  const onSpellcheckCallback = useCallback(
    debounce(() => {
      if (!onSpellcheck || !editor.selection) {
        return
      }

      const currentNodes = getTextNodesInTopAncestor(editor)
      const result = onSpellcheck(currentNodes.map(([n]) => (n as TBText)?.text || ''))
      console.log(currentNodes)
      console.log(result)
      // TODO: Now that we have a result we need to make this information
      // available to SlateEditor decorator generation
    }, spellcheckDebounceTimeout),
    [editor, onSpellcheck, spellcheckDebounceTimeout]
  )

  return (
    <Slate
      editor={editor}
      initialValue={inValue}
      onChange={(value) => {
        if (!editor.operations.some(op => 'set_selection' !== op.type)) {
          return
        }


        onChangeCallback(value)

        if (onSpellcheck) {
          onSpellcheckCallback()
        }
      }}
    >
      {children}
    </Slate>
  )
}
