import { Plugin } from '../../../../lib/types'
import { Element } from '../../../../lib/index'

export const List: Plugin.Component = ({ element, children }) => {
  const style = {
    margin: 0,
    paddingLeft: '1.8rem',
    marginBottom: '-0.8rem'
  }

  return (
    <Element className='foo'>
      {element.type === 'core/number-list'
        ? <ol role='list' style={style}>{children}</ol>
        : <ul role='list' style={style}>{children}</ul>}
    </Element>
  )
}
