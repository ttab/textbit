import React from 'react'
import { Plugin } from '../../../../../src/types'
import { Element } from '../../../../../src'

export const ListItem: Plugin.Component = ({ children, options }) => {
  return <li style={{
    listStyle: options?.listStyle as string || 'inherit'
  }}>
    <Element>
      {children}
    </Element>
  </li>
}
