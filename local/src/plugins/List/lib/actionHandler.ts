import * as uuid from 'uuid'
import { Editor, Transforms } from 'slate'

import { Element } from 'slate'
import { TextbitEditor, TextbitElement } from '../../../../../src/lib'
import { TBEditor } from '../../../../../src/types'

export const actionHandler = (editor: TBEditor, type: string) => {
  const listType = ['core/bullet-list', 'core/number-list'].includes(type) ? type : 'core/bullet-list'
  const isActive = TextbitEditor.includes(editor, listType)

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
    const node = Transforms.wrapNodes(editor, {
      id: uuid.v4(),
      class: 'text',
      type: listType,
      children: []
    })
  }

}
