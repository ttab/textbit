import React from 'react'
import { Plugin } from '../../../../../src/types'
import { Element } from '../../../../../src'

export const ListItem: Plugin.Component = ({ children }) => {
  return <Element>
    {children}
  </Element>
}
