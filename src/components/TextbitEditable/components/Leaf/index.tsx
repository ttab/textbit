import React, { CSSProperties } from 'react' // Necessary for esbuild
import { usePluginRegistry } from '@/components/PluginRegistry'
import { RenderLeafProps } from 'slate-react'
import { TextbitPlugin } from '@/lib'
import { useTextbit } from '@/components/TextbitRoot'

/**
 * Render a leaf
 * All rendered leafs are decorated with custom style and class.
 *
 * @param props RenaderLeafProps
 * @param registeredLeafs any[]
 * @returns JSX.Element
 */
export const Leaf = (props: RenderLeafProps): JSX.Element => {
  const { leaf, attributes, children } = props
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

    if (placeholders && leaf.placeholder) {
      style.position = 'relative'
      style.width = '100%'
    }
  }

  return <>
    <span
      style={{ ...style }}
      className={className}
      {...attributes}
    >
      {leaf.placeholder && placeholders &&
        <span style={{ ...style, position: 'absolute', opacity: 0.2 }} contentEditable={false}>{leaf.placeholder}</span>
      }
      {children}
    </span>

    {/* Render placeholder if applicable */}
    {/* {leaf.placeholder &&
      <div
        className="editor-block">
        <span
          className="parent leaf decoration"
          style={{
            ...style,
            opacity: 0.2,
            position: "absolute",
            top: '0'
          }}
          contentEditable={false}
        >
          {leaf.placeholder}
        </span>
      </div>
    } */}
  </>
}
