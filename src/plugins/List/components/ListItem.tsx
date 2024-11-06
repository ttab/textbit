import { Plugin } from '../../../../lib/types'
import { Element } from '../../../../lib'

export const ListItem: Plugin.Component = ({ children, options }) => {
  return (
    <li style={{
      listStyle: options?.listStyle as string || 'inherit'
    }}
    >
      <Element>
        {children}
      </Element>
    </li>
  )
}
