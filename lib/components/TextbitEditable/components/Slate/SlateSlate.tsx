import { type PropsWithChildren, useEffect } from 'react'
import { type Descendant, Editor } from 'slate'
import { Slate } from 'slate-react'
import * as uuid from 'uuid'
import { useTextbit } from '../../../TextbitRoot'
import { calculateStats } from '../../../../lib'

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
    type: 'core/text',
    class: 'text',
    children: [{ text: '' }]
  }]

  const { dispatch } = useTextbit()

  // Initialize stats
  // FIXME: This does not work for yjs editors
  useEffect(() => {
    const stats = calculateStats(editor)
    dispatch({ stats })
  }, [editor])

  return (
    <Slate
      editor={editor}
      initialValue={inValue}
      onChange={(value) => {
        if (!editor.operations.some((op) => 'set_selection' !== op.type)) {
          return
        }

        if (onChange) {
          onChange(value)
        }
      }}
    >
      {children}
    </Slate>
  )
}
