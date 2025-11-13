import { type CSSProperties } from 'react'
import { type RenderLeafProps } from 'slate-react'
import { usePluginRegistry } from '../../hooks/usePluginRegistry'
import { TextbitPlugin } from '../../utils/textbit-plugin'
import type { SpellingError } from '../../types'

/**
 * Render a leaf
 * All rendered leafs are decorated with custom style and class.
 *
 * @param props RenaderLeafProps
 * @param registeredLeafs any[]
 * @returns JSX.Element
 */
export function LeafElement(props: RenderLeafProps) {
  const { leaf } = props
  const { plugins } = usePluginRegistry()

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
      } else {
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
  }

  if (leaf.spellingError) {
    return <MisspelledLeaf {...props} className={className} style={style} />
  } else if (leaf.placeholder) {
    return <EmptyLeaf {...props} className={className} style={style} />
  } else {
    return <OrdinaryLeaf {...props} className={className} style={style} />
  }
}

function OrdinaryLeaf(props: RenderLeafProps & { className: string, style: CSSProperties }) {
  const { attributes, style, className } = props

  return (
    <span
      style={style}
      className={className}
      {...attributes}
    >
      {props.children}
    </span>
  )
}

function EmptyLeaf(props: RenderLeafProps & { className: string, style: CSSProperties }) {
  const { leaf, attributes, style, className } = props

  return (
    <div
      style={{
        ...style,
        width: '100%',
        position: 'relative'
      }}
      className={className}
      {...attributes}
    >
      {props.children}
      {leaf.placeholder && <Placeholder value={leaf.placeholder} style={style} />}
    </div>
  )
}

function MisspelledLeaf(props: RenderLeafProps & { className: string, style: CSSProperties }) {
  const { leaf, attributes, style, className } = props
  const spellingError = leaf.spellingError as unknown as SpellingError | undefined

  return (
    <span
      style={style}
      className={className}
      data-spelling-error={spellingError?.id || ''}
      data-spelling-level={spellingError?.level || undefined}
      {...attributes}
    >
      {props.children}
    </span>
  )
}

function Placeholder({ value, style }: { value: string, style: CSSProperties }) {
  return (
    <div
      style={{
        ...style,
        opacity: 0.333,
        position: 'absolute',
        top: 0,
        pointerEvents: 'none'
      }}
      contentEditable={false}
    >
      {value}
    </div>
  )
}
