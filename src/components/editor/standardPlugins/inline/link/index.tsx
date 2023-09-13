import React, { useState, useRef } from 'react'
import { Editor, Transforms, Range, Element as SlateElement } from 'slate'
import { ReactEditor } from 'slate-react'
import { MimerElement } from '../..'

import { MimerPlugin, RenderElementFunction, ToolFunction } from '../../../types'

import { MdEdit, MdLink, MdLinkOff } from 'react-icons/md'
import * as uuid from 'uuid'
import isUrl from 'is-url'

/**
 * FIXME
 * 1. v When url input has focus, allow ESC to move focus to text content again
 * 2. v When text content has focus, allow opt+k to focus url input
 * 3. v Use another color on underline to indicate error more clearly
 * 4.   Expand to allow editing of more properties
 * 5.   Add InlineChromiumBugfix as is in https://github.com/ianstormtaylor/slate/blob/main/site/examples/inlines.tsx
 */

const renderLinkComponent: RenderElementFunction = ({ attributes, children, element }) => {
    const url: string = element.properties?.url as string || ''

    return (
        <a
            {...attributes}
            href={url}
            title={`${element.properties?.title || ''}`}
            className={`${isUrl(url) ? 'fg-link' : 'fg-error'}`}
            style={{
                textDecorationStyle: isUrl(url) ? 'solid' : 'wavy'
            }}
        >
            {/* <InlineChromiumBugfix /> */}
            {children}
            {/* <InlineChromiumBugfix /> */}
        </a>
    )
}

const EditLink: ToolFunction = (editor, entry) => {
    const [node, path] = entry

    if (!SlateElement.isElement(node)) {
        return <></>
    }

    const [url, seturl] = useState(node.properties?.url || '')
    const inputRef = useRef<HTMLInputElement>(null)

    return <>
        <span
            className='editor-tool r-less bg-base-hover'
            onMouseDown={(e) => {
                e.preventDefault()
                deleteLink(editor)
            }}
        >
            <MdLinkOff />
        </span>

        <span className="editor-tool" style={{ paddingLeft: '0px', paddingRight: '0px' }}>
            <input
                className="text-ui"
                style={{ margin: '-5px 0' }}
                id={node.id}
                ref={inputRef}
                type="text"
                value={url}
                onClick={(e) => { e.currentTarget.focus() }}
                onChange={(e) => {
                    seturl(e.target.value)
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Escape' || e.key === 'Enter') {
                        e.preventDefault()

                        if (url === '') {
                            deleteLink(editor)
                        }
                        ReactEditor.focus(editor)
                    }
                }}
                onBlur={(e) => {
                    if (url !== '') {
                        Transforms.setNodes(
                            editor,
                            {
                                properties: {
                                    ...node.properties,
                                    url: url
                                }
                            },
                            { at: path }
                        )
                    }
                }}
            />
        </span>

        {/* <span
            className='editor-tool r-less bg-base-hover'
        // FIXME: Handle edit more properties...
        //
        // onMouseDown={(e) => {
        //     e.preventDefault()
        //     action.handler(editor, 2)
        // }}
        ><MdEdit /></span> */}
    </>
}

const deleteLink = (editor: Editor) => {
    Transforms.unwrapNodes(editor, {
        match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'core/link',
    })
}

export const Link: MimerPlugin = {
    class: 'inline',
    name: 'core/link',
    component: {
        render: renderLinkComponent
    },
    actions: [{
        tool: [
            <MdLink />,
            EditLink
        ],
        hotkey: 'mod+k',
        handler: ({ editor }) => {
            if (!editor.selection) {
                return
            }

            const { selection } = editor
            const isCollapsed = selection && Range.isCollapsed(selection)

            // If we already have a link, focus on it's input
            const nodeEntries = Array.from(Editor.nodes(editor, {
                at: Editor.unhangRange(editor, selection),
                match: n => !Editor.isEditor(n) && MimerElement.isInline(n) && MimerElement.isOfType(n, 'core/link')
            }))

            if (nodeEntries.length) {
                const node = nodeEntries[0][0]
                if (SlateElement.isElement(node) && node?.id) {
                    document.getElementById(node.id)?.focus()
                }
                return
            }

            const id = uuid.v4()

            const link = {
                class: 'inline',
                type: 'core/link',
                id,
                properties: {
                    url: '',
                    title: '',
                    target: ''
                },
                children: isCollapsed ? [{ text: '' }] : [],
            }

            if (isCollapsed) {
                Transforms.insertNodes(editor, link)
            }
            else {
                Transforms.wrapNodes(editor, link, { split: true })
                Transforms.collapse(editor, { edge: 'end' })
            }

            // HACK: Let the event loop make sure everyting is rerendered. Then focus
            // FIXME: Use temporary property that signal this is a new/uninitial. Then
            setTimeout(() => {
                document.getElementById(id)?.focus()
            })
        }
    }]
}

