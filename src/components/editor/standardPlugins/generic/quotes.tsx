import { Editor, Transforms } from 'slate'
import { MimerPlugin, InputEventFunction } from '../../../../types'

const AllQuotes = {
    'sv': ['’', '’', '”', '”'],
    'fi': ['’', '’', '”', '”'],
    'hu': ['’', '’', '„', '”'],
    'pl': ['‚', '’', '„', '”'],
    'no': ['‹', '›', '«', '»'],
    'en': ['‘', '’', '“', '”'],
    'da': ['„', '“', '„', '“'],
    'de': ['‚', '‘', '„', '“'],
    'fr': ['‹ ', ' ›', '« ', '»']
}

const macroHandler: InputEventFunction = (editor, text) => {
    // Only handle single and double "computer" quotes
    if (text !== '\'' && text !== '"') {
        return
    }

    // Range here is for the leaf if in a bold word. This is useless as
    // it needs to be the range in the whole block
    // FIXME: Walk the tree to get the real full text offset
    const range = Editor.unhangRange(editor, editor.selection)
    const anchor = range.anchor
    const offset = anchor.offset

    if (!range?.anchor) {
        return
    }

    const at = (range && range.anchor.path[0] > 0) ? range.anchor.path[0] : 0
    const fragment = Editor.string(editor, [at])

    // Fixme: This should obviously come from the document locale...
    const locale = 'en'
    const q = AllQuotes[locale] || AllQuotes['en']

    // Which are the typographic quote we want for the char?
    let quotes: string[] = []
    if (text === '\'') {
        quotes = [q[0], q[1]]
    }
    else if (text === '"') {
        quotes = [q[2], q[3]]
    }
    else {
        return // This should never happen if the matcher is alrighty
    }

    // Find previously inserted same char if it exists
    let prev = -1
    for (let n = offset; n > -1; n--) {
        if (fragment[n] === quotes[0]) {
            // We are in a already opened quote, assume it is closed after the offet
            // TODO: Look forward to see there is a closing quote, if not close this one
            return
        }
        if (fragment[n] === text) {
            prev = n;
            break;
        }
    }

    if (prev === -1) {
        return
    }

    // Remember, this only works on FIRST top level leaf. It does not
    // work when cursor is in following leafs (when there are leafs (bold etc)).
    // FIXME: Find the Point that gives us the position in the correct leaf(s)
    Transforms.insertText(editor, quotes[1], {
        at: { path: [at, 0], offset: offset },
    })

    Transforms.delete(editor, {
        at: { path: [at, 0], offset: prev }
    })

    Transforms.insertText(editor, quotes[1], {
        at: { path: [at, 0], offset: prev },
    })

    return false // Prevent further handling of this event
}

export const Quotes: MimerPlugin = {
    class: 'generic',
    name: 'quotes',
    events: [{
        on: 'input',
        handler: macroHandler
    }]
}