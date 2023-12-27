import React from 'react'
import { BsListUl, BsListOl } from 'react-icons/bs'

import { TBPlugin } from '../../../../src/types'

import { List, ListItem } from './components'
import { actionHandler } from './lib/actionHandler'
import { normalizeNode } from './lib/normalizeNode'
import { Editor, NodeEntry } from 'slate'

export const BulletList: TBPlugin = {
  class: 'text',
  name: 'core/bullet-list',
  actions: [
    {
      title: 'Bullet list',
      tool: <BsListUl />,
      hotkey: 'mod+shift+8',
      handler: ({ editor }) => {
        actionHandler(editor, 'core/bullet-list')
      },
      visibility: (element) => {
        return [
          element.type === 'core/bullet-list',
          true,
          element.type === 'core/bullet-list'
        ]
      }
    }
  ],
  component: {
    class: 'text',
    render: List,
    constraints: {
      normalizeNode: (editor: Editor, nodeEntry: NodeEntry) => {
        return normalizeNode(editor, nodeEntry, 'core/bullet-list')
      }
    },
    children: [
      {
        type: 'list-item',
        class: 'text',
        render: ListItem
      }
    ]
  }
}

export const NumberList: TBPlugin = {
  class: 'text',
  name: 'core/number-list',
  actions: [
    {
      title: 'Number list',
      tool: <BsListOl />,
      hotkey: 'mod+shift+7',
      handler: ({ editor }) => {
        actionHandler(editor, 'core/number-list')
      },
      visibility: (element) => {
        return [
          element.type === 'core/number-list',
          true,
          element.type === 'core/number-list'
        ]
      }
    }
  ],
  component: {
    class: 'text',
    render: List,
    constraints: {
      normalizeNode: (editor: Editor, nodeEntry: NodeEntry) => {
        return normalizeNode(editor, nodeEntry, 'core/number-list')
      }
    },
    children: [
      {
        type: 'list-item',
        class: 'text',
        render: ListItem
      }
    ]
  }
}
