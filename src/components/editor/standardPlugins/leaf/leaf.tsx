import React from 'react' // Necessary for esbuild
import { Editor, Transforms, Text } from 'slate'
import { MdFormatBold, MdFormatItalic, MdFormatUnderlined } from 'react-icons/md'
import { MimerPlugin } from '../../../../types'

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

// const renderBold: RenderFunction = ({ children }) => {
//     return <span className="font-bold">
//         {children}
//     </span>
// }

// const renderItalic: RenderFunction = ({ children }) => {
//     return <span className="italic">
//         {children}
//     </span>
// }

// const renderUnderline: RenderFunction = ({ children }) => {
//     return <span className="underline">
//         {children}
//     </span>
// }

const Bold: MimerPlugin = {
    class: 'leaf',
    name: 'bold',
    // renderers: [{
    //     render: renderBold
    // }],
    actions: [{
        tool: <MdFormatBold />,
        hotkey: 'mod+b',
        handler: () => true
    }]
}

const Italic: MimerPlugin = {
    class: 'leaf',
    name: 'italic',
    // renderers: [{
    //     render: renderItalic
    // }],
    actions: [{
        tool: <MdFormatItalic />,
        hotkey: 'mod+i',
        handler: () => true
    }]
}

const Underline: MimerPlugin = {
    class: 'leaf',
    name: 'underline',
    // renderers: [{
    //     render: renderUnderline
    // }],
    actions: [{
        hotkey: 'mod+u',
        tool: <MdFormatUnderlined />,
        handler: () => true
    }]
}

export {
    Bold,
    Italic,
    Underline
}