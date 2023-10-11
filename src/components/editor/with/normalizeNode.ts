import { Editor, Element, Node, NodeEntry, Transforms } from "slate"
import { TextbitComponent, TextbitPlugin } from "../../../types"
import { RegistryComponent } from "../registry"
import { componentConstraints } from "@/lib/componentConstraints"

type NormalizerFunc = (editor: Editor, entry: NodeEntry) => true | void
type NormalizerMap = Map<string, NormalizerFunc>

export const withNormalizeNode = (editor: Editor, plugins: TextbitPlugin[], components: Map<string, RegistryComponent>) => {
  const { normalizeNode } = editor

  editor.normalizeNode = (entry) => {
    const [node, path] = entry

    // Normalization constraints only supported on Elements
    if (!Element.isElement(node)) {
      return normalizeNode(entry)
    }

    const item = components.get(node.type)
    if (!item) {
      return normalizeNode(entry)
    }

    // Use component normalizer if exists
    if (typeof item.component.constraints?.normalizeNode === 'function') {
      if (true === item.component.constraints?.normalizeNode(editor, entry)) {
        return
      }
    }

    normalizeNode(entry)

    // const parent = Node.parent(editor, path)

    // if (Editor.isEditor(parent) && item.parent) {
    //     console.log(`${item.type} should be in ${item.parent.type}, but is in editor`)
    // }
    // else if (Element.isElement(parent) && item.parent?.type !== parent.type) {
    //     console.log(`${item.type} should be in ${item.parent?.type || 'editor'}, but is in ${parent.type}`)
    //     // debugger
    //     // for (const [child, childPath] of Node.children(editor, path)) {
    //     //     if (Element.isElement(child)) {
    //     //         Transforms.unwrapNodes(editor, { at: childPath })
    //     //         return
    //     //     }
    //     // }
    //     // return
    // }

    // Check to see if we still have invalid children, then remove them
    // const allowedChildren = item.component?.children?.map(c => `${item.type}/${c.type}`) || []
    // for (const [child, childPath] of Node.children(editor, path)) {
    //     if (Element.isElement(child) && !allowedChildren.includes(child.type)) {
    //         console.warn(`${item.type} contains ${child.type} but only allows ${allowedChildren.join(', ')}`)
    //     }
    // }

    // Check constraints and handle them
    // const constraints = componentConstraints(item.component)

    // if (constraints.maxElements > 0) {

    // }
    // else if (constraints.minElements > 0) {

    // }
    // else if (constraints.maxLength > 0) {

    // }
    // else {
    //     return normalizeNode(entry)
    // }

    // Normalization supported on Elements only as of now. If supported on
    // leafs, who should handle a leaf with formats e.g "core/bold, core/italic"?
    // if (Element.isElement(node)) {
    //     const eventHandler = normalizeHandlers.get(node.type)
    //     if (eventHandler && true === eventHandler(editor, entry)) {
    //         // If eventHandler returns true, it has handled it
    //         return
    //     }
    // }
  }

  return editor
}

function addNormalizerForComponent(componentType: string, normalizers: NormalizerMap, normalizer: NormalizerFunc, component: TextbitComponent) {
  normalizers.set(componentType, normalizer)

  // As for now we only support normalization to be handled by the plugin
  // (i.e the top component). If child components should have support for
  // normalization they should probably have their own event handlers, not
  // share with the plugin as below.

  // if (!Array.isArray(component?.children)) {
  //     return
  // }

  // component.children.forEach(childComponent => {
  //     addNormalizerForComponent(
  //         `${componentType}/${childComponent.type}`,
  //         normalizers,
  //         normalizer,
  //         childComponent
  //     )
  // })
}