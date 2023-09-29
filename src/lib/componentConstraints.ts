import { TextbitComponent } from "src/types"

export function componentConstraints(component: TextbitComponent) {
  const {
    maxLength = -1,        // Max length of text content
    maxElements = -1,      // Max no of elements in parent
    minElements = 0,       // Min no of elements in parent
    allowBreak = true,     // Allow normal break to create new node of same type
    allowSoftBreak = false // Allow soft break (newline in text node)
  } = component?.constraints || {}

  return {
    maxLength,
    maxElements,
    minElements,
    allowBreak,
    allowSoftBreak
  }
}

