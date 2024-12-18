import { Plugin } from '../../../../lib/types'

export const ListItem: Plugin.Component = ({ children, options }) => {
  return (
    <li style={{
      listStyle: options?.listStyle as string || 'inherit'
    }}
    >
      {children}
    </li>
  )
}
