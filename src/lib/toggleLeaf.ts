import { Editor, Transforms, Text } from 'slate'

/**
 * Toggle leaf marks stored as plugin names in formats array for leaf nodes
 * 
 * FIXME: Clears formats if first part of selection don't have formats but the
 * second half of the seletion have as the check for existing formats only
 * look at the first part, and then clears it before moving on to add the new.
 */
export const toggleLeaf = (editor: Editor, type: string) => {
  const hasMark = textHasMark(editor, type)
  const marks = Editor.marks(editor)
  let formats: string[] = []

  if (hasMark) {
    // Filter out the existing mark
    formats = marks?.formats?.filter((f: string) => f !== type) || []
  }
  else {
    // Add mark to formats array
    formats = [...marks?.formats || [], type]
  }

  if (!formats.length) {
    // If no formats, remove it altogether
    Editor.removeMark(editor, 'formats')
  }
  else {
    // Set the formats array
    Transforms.setNodes(editor, { formats }, { match: n => Text.isText(n), split: true })
  }
}

const textHasMark = (editor: Editor, format: string) => {
  const marks = Editor.marks(editor)
  return marks ? marks.formats?.includes(format) : false
}