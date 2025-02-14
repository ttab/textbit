import { Editor } from 'slate'

export const withLang = (editor: Editor, lang?: string) => {
  editor.lang = lang || document?.documentElement?.lang || navigator.language || 'en'
  return editor
}
