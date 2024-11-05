import { type Plugin } from "../types"

export function componentConstraints(entry: Plugin.ComponentEntry) {
  const {
    // maxLength = undefined,   // Max length of text content
    // maxElements = undefined, // Max no of elements in parent
    // minElements = undefined, // Min no of elements in parent
    allowBreak,       // Allow normal break to create new node of same type
    allowSoftBreak,  // Allow soft break (newline in text node)
    normalizeNode
  } = entry?.constraints || {}

  return {
    // maxLength: maxLength ?? 0, // I.e no limit
    // maxElements: maxElements ?? 0, // I.e no limit
    // minElements: minElements ?? 0,
    allowBreak: allowBreak ?? true,
    allowSoftBreak: allowSoftBreak ?? false,
    normalizeNode: normalizeNode instanceof Function ? normalizeNode : undefined
  }
}
