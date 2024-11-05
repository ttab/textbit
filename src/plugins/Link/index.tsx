import { Plugin } from '../../../lib/types'
import { BsLink } from 'react-icons/bs'

import { Link as LinkComponent } from './components/Link'
import { EditLink as EditLinkComponent } from './components/EditLink'

import './style.css'
import { actionHandler } from './lib/actionHandler'

export const Link: Plugin.InitFunction = (options) => {
  return {
    class: 'inline',
    name: 'core/link',
    options,
    componentEntry: {
      class: 'inline',
      component: LinkComponent
    },
    actions: [{
      name: 'toggle-link',
      tool: [
        () => <BsLink />,
        ({ editor, entry, active }) => <EditLinkComponent editor={editor} entry={entry} active={active} />
      ],
      hotkey: 'mod+k',
      handler: ({ editor }) => {
        actionHandler(editor, 'core/link')
      }
    }]
  }
}
