import React from 'react'
import { TBRenderElementFunction } from '../../../../../src/types'
import { TextbitElement } from '../../../../../src'

export const List: TBRenderElementFunction = ({ element, children }) => {
  const { properties = {} } = TextbitElement.isElement(element) ? element : {}

  const style = {
    margin: 0,
    paddingLeft: '1.8rem',
    marginBottom: '-0.8rem'
  }

  return element.type === 'core/number-list'
    ? <ol role="list" style={style}>{children}</ol>
    : <ul role="list" style={style}>{children}</ul>
}
