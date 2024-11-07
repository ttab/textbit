import { type CSSProperties } from 'react'
import { usePluginRegistry } from '../../../../components/PluginRegistry'
import { type RenderLeafProps } from 'slate-react'
import { TextbitPlugin } from '../../../../lib'
import { useTextbit } from '../../../../components/TextbitRoot'
import type { SpellingError } from '../../../../types'

/**
 * Render a leaf
 * All rendered leafs are decorated with custom style and class.
 *
 * @param props RenaderLeafProps
 * @param registeredLeafs any[]
 * @returns JSX.Element
 */
export const Leaf = (props: RenderLeafProps): JSX.Element => {
  const { leaf } = props
  const { plugins } = usePluginRegistry()
  const { placeholders } = useTextbit()

  if (!leaf) {
    return <></>
  }

  const pluginNames = Object.keys(leaf).reduce((previous, current) => {
    return leaf[current] === true ? [...previous, current] : previous
  }, [] as string[])

  let className = 'leaf'
  let style: CSSProperties = {}
  for (const plugin of plugins) {
    if (pluginNames.includes(plugin.name) && TextbitPlugin.isLeafPlugin(plugin)) {
      const leafStyle = plugin.getStyle()
      if (typeof leafStyle === 'string') {
        className += leafStyle ? ` ${leafStyle}` : ''
      }
      else {
        style = {
          ...style,
          ...leafStyle
        }
      }
    }
  }

  if (leaf.text === '') {
    // The following is a workaround for a Chromium bug where, if you have an inline at
    // the end of a block, clicking the end of a block puts the cursor inside the inline
    // instead of inside the final {text: ''} node.
    // https://github.com/ianstormtaylor/slate/issues/4704#issuecomment-1006696364
    style.paddingLeft = '0.1px'

    if (placeholders === 'multiple' && leaf.placeholder) {
      style.position = 'relative'
      style.width = '100%'
    }
  }

  return (!!leaf.spellingError)
    ? <MisspelledLeaf {...props} className={className} style={style} />
    : <OrdinaryLeaf {...props} className={className} style={style} />
}


function OrdinaryLeaf(props: RenderLeafProps & { className: string, style: CSSProperties }): JSX.Element {
  const { placeholders } = useTextbit()
  const { leaf, attributes, children, style, className } = props

  return <>
    <span
      style={{ ...style }}
      className={className}
      {...attributes}
    >
      {leaf.placeholder && placeholders === 'multiple' &&
        <Placeholder value={leaf.placeholder} style={style} />
      }
      {children}
    </span>
  </>
}


function MisspelledLeaf(props: RenderLeafProps & { className: string, style: CSSProperties }): JSX.Element {
  const { placeholders } = useTextbit()
  const { leaf, attributes, children, style, className } = props
  const spellingError = leaf.spellingError as unknown as SpellingError | undefined

  return <>
    <span
      style={{ ...style }}
      className={className}
      data-spelling-error={spellingError?.id || ''}
      {...attributes}
    >
      {leaf.placeholder && placeholders === 'multiple' &&
        <Placeholder value={leaf.placeholder} style={style} />}
      {children}
    </span>
  </>
}


function Placeholder({ value, style }: { value: string, style: CSSProperties }): JSX.Element {
  return (
    <span
      style={{
        ...style,
        position: 'absolute',
        opacity: 0.333
      }}
      contentEditable={false}
    >
      {value}
    </span>
  )
}
