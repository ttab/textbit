import { Element } from 'slate'
import { useSlateStatic, type RenderElementProps } from 'slate-react'
import type { ChildComponentEntry } from '../../types'

interface ChildElementProps extends RenderElementProps {
  entry: ChildComponentEntry
  rootNode: Element
  options?: Record<string, unknown>
}

export function ChildElement({
  attributes,
  children,
  element,
  entry,
  rootNode,
  options
}: ChildElementProps) {
  const editor = useSlateStatic()
  const { component: Component } = entry
  const lang = element.lang || editor.lang

  // Default: wrap the plugin component in a <div> so framework attributes
  // (data-id, data-type, slate-react's data-slate-node, ref) reliably reach
  // the DOM regardless of what the plugin component renders.
  if (!entry.asOwnElement) {
    return (
      <div
        lang={lang}
        data-id={element.id}
        data-type={element.type}
        className='child'
        {...attributes}
      >
        <Component element={element} rootNode={rootNode} options={options} editor={editor}>
          {children}
        </Component>
      </div>
    )
  }

  // Opt-in: the plugin component renders as the element itself, owning its
  // root DOM node. It must spread `attributes` and attach `ref` onto that
  // root. Used when the structural HTML tag matters (e.g. <tr> inside
  // <table>, <li> inside <ul>).
  const { ref, ...slateAttributes } = attributes
  const decoratedAttributes = {
    ...slateAttributes,
    lang,
    'data-id': element.id,
    'data-type': element.type,
    className: 'child'
  }

  return (
    <Component
      element={element}
      attributes={decoratedAttributes}
      rootNode={rootNode}
      options={options}
      editor={editor}
      ref={ref}
    >
      {children}
    </Component>
  )
}
