import { Editor, Element, Transforms, type NodeEntry, type Descendant } from 'slate'
import type { PluginDefinition, ChildComponentEntry } from '../types/textbit'
import type { PluginRegistryComponent } from '../contexts/PluginRegistry/lib/types'

export function withNormalizeNode(editor: Editor, _: PluginDefinition[], components: Map<string, PluginRegistryComponent>) {
  const { normalizeNode } = editor

  editor.normalizeNode = (nodeEntry) => {
    const [node] = nodeEntry

    // Declarative constraints only apply to Elements
    if (!Element.isElement(node)) {
      return normalizeNode(nodeEntry)
    }

    const item = components.get(node.type)
    if (!item) {
      return normalizeNode(nodeEntry)
    }

    // Declarative child-constraint enforcement (excess → missing → order).
    // Each sub-step returns true if it mutated the tree, in which case we
    // exit early so Slate re-runs normalization on the updated state.
    if (enforceChildConstraints(editor, nodeEntry, item)) {
      return
    }

    // Custom plugin normalizer runs after declarative enforcement
    if (typeof item.componentEntry.constraints?.normalizeNode === 'function') {
      if (true === item.componentEntry.constraints.normalizeNode(editor, nodeEntry)) {
        return
      }
    }

    normalizeNode(nodeEntry)
  }

  return editor
}

/**
 * Enforce declarative child count / ordering constraints on a parent element.
 * Returns true if a change was made (caller should exit so normalization re-runs).
 */
function enforceChildConstraints(
  editor: Editor,
  nodeEntry: NodeEntry,
  parent: PluginRegistryComponent
): boolean {
  const [node, path] = nodeEntry
  if (!Element.isElement(node)) return false

  const childDefs = parent.componentEntry.children
  if (!childDefs || childDefs.length === 0) return false

  // Only constrained child types participate in enforcement
  const constrained = childDefs.filter(
    (c) => c.constraints?.min !== undefined || c.constraints?.max !== undefined
  )
  if (constrained.length === 0) return false

  const parentType = parent.type

  // Step 1 — remove excess (count > max)
  for (const def of constrained) {
    const max = def.constraints?.max
    if (max === undefined) continue
    const fullType = `${parentType}/${def.type}`
    const indices = childIndicesOfType(node, fullType)
    if (indices.length > max) {
      // Remove the last excess child (iterating end→start avoids cascading index shifts)
      const toRemove = indices[indices.length - 1]
      Transforms.removeNodes(editor, { at: [...path, toRemove] })
      return true
    }
  }

  // Step 2 — insert missing (count < min)
  for (const def of constrained) {
    const min = def.constraints?.min
    if (min === undefined) continue
    const fullType = `${parentType}/${def.type}`
    const count = childIndicesOfType(node, fullType).length
    if (count < min) {
      const insertAt = idealIndexForChildType(node, childDefs, def)
      Transforms.insertNodes(editor, placeholderForChild(def, fullType), {
        at: [...path, insertAt]
      })
      return true
    }
  }

  // Step 3 — reorder mispositioned children
  // Each child gets an "expected rank" from its type's index in childDefs.
  // Unknown types get Infinity (we don't reorder them — out of scope for v1).
  const rankOfType = new Map<string, number>()
  childDefs.forEach((def, idx) => {
    if (def.type) rankOfType.set(`${parentType}/${def.type}`, idx)
  })

  const ranks = node.children.map((c) =>
    Element.isElement(c) ? rankOfType.get(c.type) ?? Infinity : Infinity
  )

  for (let i = 1; i < ranks.length; i++) {
    if (ranks[i] < ranks[i - 1]) {
      // Find where this child belongs: before the first sibling with rank >= ranks[i]
      let target = 0
      for (let j = 0; j < i; j++) {
        if (ranks[j] >= ranks[i]) {
          target = j
          break
        }
        target = j + 1
      }
      Transforms.moveNodes(editor, {
        at: [...path, i],
        to: [...path, target]
      })
      return true
    }
  }

  return false
}

function childIndicesOfType(parent: Element, fullType: string): number[] {
  const out: number[] = []
  for (let i = 0; i < parent.children.length; i++) {
    const c = parent.children[i]
    if (Element.isElement(c) && c.type === fullType) out.push(i)
  }
  return out
}

/**
 * Ideal index for a missing child of `def`: one past the last DOM child whose
 * type has a smaller rank (earlier in the parent's `children` array), or 0.
 */
function idealIndexForChildType(
  parent: Element,
  childDefs: ChildComponentEntry[],
  def: ChildComponentEntry
): number {
  const parentTypeToRank = new Map<string | undefined, number>()
  childDefs.forEach((d, i) => parentTypeToRank.set(d.type, i))
  const targetRank = parentTypeToRank.get(def.type) ?? 0

  let idx = 0
  for (let i = 0; i < parent.children.length; i++) {
    const c = parent.children[i]
    if (!Element.isElement(c)) continue
    // Full type is `${parentType}/${childType}` but here we only know the full type on children.
    // Extract the short suffix by trying each childDef.
    const rank = rankForChildNode(c.type, childDefs)
    if (rank < targetRank) idx = i + 1
  }
  return idx
}

function rankForChildNode(fullChildType: string, childDefs: ChildComponentEntry[]): number {
  for (let i = 0; i < childDefs.length; i++) {
    const def = childDefs[i]
    if (def.type && fullChildType.endsWith(`/${def.type}`)) return i
  }
  return Infinity
}

function placeholderForChild(def: ChildComponentEntry, fullType: string): Descendant {
  const base = {
    id: crypto.randomUUID(),
    type: fullType,
    children: [{ text: '' }]
  }
  switch (def.class) {
    case 'void':
      return { ...base, class: 'void' } as unknown as Descendant
    case 'block':
      return { ...base, class: 'block' } as unknown as Descendant
    case 'text':
      return { ...base, class: 'text', properties: {} } as unknown as Descendant
    default:
      // Any other class (e.g. an invalid plugin config) falls back to a text
      // placeholder — the least surprising, least breakable shape for Slate.
      return { ...base, class: 'text', properties: {} } as unknown as Descendant
  }
}

