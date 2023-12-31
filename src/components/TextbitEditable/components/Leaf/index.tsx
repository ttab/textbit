import React from 'react' // Necessary for esbuild
import { RenderLeafProps } from 'slate-react'

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

  if (!leaf) {
    return <></>
  }

  const classNames = Object.keys(leaf).reduce((previous, current) => {
    return leaf[current] === true ? [...previous, current] : previous
  }, [] as string[])

  // The following is a workaround for a Chromium bug where, if you have an inline at
  // the end of a block, clicking the end of a block puts the cursor inside the inline
  // instead of inside the final {text: ''} node.
  // https://github.com/ianstormtaylor/slate/issues/4704#issuecomment-1006696364
  const style: any = {}
  if (leaf.text === '') {
    style.paddingLeft = '0.1px'
  }

  return <>
    <span
      style={style}
      className={`leaf ${classNames.join(' ')}`}
      {...attributes}>
      {children}
    </span>

    {/* Render placeholder if applicable */}
    {leaf.placeholder &&
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
    }
  </>
}
