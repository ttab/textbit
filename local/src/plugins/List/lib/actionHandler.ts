import * as uuid from 'uuid'
import { Editor, Transforms } from 'slate'

import { TBEditor, TBElement } from '../../../../../src/lib'
import { TBElement as TBElementType } from '../../../../../src/types'

export const actionHandler = (editor: Editor, type: string) => {
  const listType = ['core/bullet-list', 'core/number-list'].includes(type) ? type : 'core/bullet-list'
  const isActive = TBEditor.includes(editor, listType)

  Transforms.unwrapNodes(editor, {
    match: (n) =>
      !TBEditor.isEditor(n)
      && TBElement.isElement(n)
      && ['core/bullet-list', 'core/number-list'].includes(n.type),
    split: true
  })

  const newProperties: Partial<TBElementType> = {
    type: isActive ? 'core/text' : `${listType}/list-item`,
    properties: {}
  }

  Transforms.setNodes<TBElementType>(editor, newProperties, {
    match: (n) => {
      return !TBEditor.isEditor(n) &&
        TBElement.isElement(n) &&
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
