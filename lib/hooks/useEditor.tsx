import { useSlateStatic } from 'slate-react'
import type { Editor } from 'slate'

export function useEditor(): Editor {
  return useSlateStatic()
}
