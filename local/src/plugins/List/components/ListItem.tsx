import React from 'react'
import { Plugin } from '../../../../../src/types'

export const ListItem: Plugin.Component = ({ children }) => {
  return <li role="listitem" style={{ paddingLeft: '0.8rem', paddingBottom: '0.6rem' }}>
    {children}
  </li>
}
