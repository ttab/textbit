import type {
  Plugin,
  TBEditor,
  TBElement,
  TBText
} from '@ttab/textbit'

import {
  CodeBlock as CodeBlockComponent,
  CodeBlockBody as CodeBlockBodyComponent,
  CodeBlockTitle as CodeBlockTitleComponent
} from './components'

/**
 * Define Slate CustomTypes to be Textbit types
 */
declare module 'slate' {
  interface CustomTypes {
    Editor: TBEditor
    Element: TBElement
    Text: TBText
  }
}

export const CodeBlock: Plugin.InitFunction = () => {
  return {
    class: 'textblock',
    name: 'core/codeblock',
    componentEntry: {
      class: 'textblock',
      component: CodeBlockComponent,
      children: [
        {
          type: 'title',
          class: 'text',
          component: CodeBlockTitleComponent,
          constraints: {
            allowBreak: false
          }
        },
        {
          type: 'body',
          class: 'text',
          component: CodeBlockBodyComponent
        }]
    }
  }
}
