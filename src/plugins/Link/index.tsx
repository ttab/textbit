import type { TBPluginInitFunction } from '../../../lib/main'
import { Link as LinkComponent } from './components/Link'
import { EditLink as EditLinkComponent } from './components/EditLink'

import { actionHandler as handler } from './lib/actionHandler'

/**
 * FIXME
 * 1. v When url input has focus, allow ESC to move focus to text content again
 * 2. v When text content has focus, allow opt+k to focus url input
 * 3. v Use another color on underline to indicate error more clearly
 * 4.   Expand to allow editing of more properties
 * 5.   Add InlineChromiumBugfix as is in https://github.com/ianstormtaylor/slate/blob/main/site/examples/inlines.tsx
 */

const Link: TBPluginInitFunction = () => {
  return {
    class: 'inline',
    name: 'core/link',
    componentEntry: {
      class: 'inline',
      component: LinkComponent
    },
    actions: [{
      name: 'link',
      tool: [
        () => <span>L</span>,
        EditLinkComponent
      ],
      hotkey: 'mod+k',
      handler
    }]
  }
}

export { Link }
