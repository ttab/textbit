import * as uuid from 'uuid'
import { Transforms } from 'slate'

import { Element } from 'slate'
import { TextbitEditor, TextbitElement } from '../../../../lib/lib'
import { TBEditor, Plugin } from '../../../../lib/types'

export const actionHandler = (editor: TBEditor, type: string, options: Plugin.Options = {}) => {
  const listType = ['core/bullet-list', 'core/number-list'].includes(type) ? type : 'core/bullet-list'
  const isActive = TextbitEditor.includes(editor, listType)

  // Output options in the console "for show"
  console.log(options)

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !TextbitEditor.isEditor(n)
      && TextbitElement.isElement(n)
      && ['core/bullet-list', 'core/number-list'].includes(n.type),
    split: true
  })

  const newProperties: Partial<Element> = {
    type: isActive ? 'core/text' : `${listType}/list-item`,
    properties: {}
  }

  Transforms.setNodes<Element>(editor, newProperties, {
    match: (n) => {
      return !TextbitEditor.isEditor(n) &&
        TextbitElement.isElement(n) &&
        n.class === 'text'
    }
  })

  if (!isActive) {
    Transforms.wrapNodes(editor, {
      id: uuid.v4(),
      class: 'text',
      type: listType,
      children: []
    })
  }
}
