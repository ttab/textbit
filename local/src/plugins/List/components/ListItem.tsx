import React from 'react'
import { TBRenderElementFunction } from '../../../../../src/types'

export const ListItem: TBRenderElementFunction = ({ children }) => {
  return <li role="listitem" style={{ paddingLeft: '0.8rem', paddingBottom: '0.6rem' }}>
    {children}
  </li>
}
