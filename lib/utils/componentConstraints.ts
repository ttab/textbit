import { type ComponentEntry, type ChildComponentEntry, type ChildConstraints } from '../types/textbit'

export function componentConstraints(entry: ComponentEntry | ChildComponentEntry) {
  // Read through the widest constraints type — top-level entries simply have
  // `min` / `max` as `never` (i.e. undefined at runtime).
  const constraints = (entry?.constraints ?? {}) as ChildConstraints

  const {
    allowBreak,
    allowSoftBreak,
    normalizeNode,
    allowEdgeWhitespace,
    min,
    max
  } = constraints

  return {
    min, // Min instances of this child type in parent (undefined = no limit)
    max, // Max instances of this child type in parent (undefined = no limit)
    allowBreak: allowBreak ?? true,
    allowSoftBreak: allowSoftBreak ?? false,
    allowEdgeWhitespace: allowEdgeWhitespace ?? true,
    normalizeNode: normalizeNode instanceof Function ? normalizeNode : undefined
  }
}
