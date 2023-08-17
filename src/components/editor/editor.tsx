import React from 'react' // Necessary for esbuild
import { useEffect, useMemo, useState, useCallback } from 'react'
import { createEditor, Editor as SlateEditor, Descendant, Transforms, Element as SlateElement, Range } from "slate"
import { withHistory } from "slate-history"
import { ReactEditor, Editable, Slate, withReact } from "slate-react"
import * as uuid from 'uuid'

import '@fontsource/inter/variable.css'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/source-serif-pro/300.css'
import '@fontsource/source-serif-pro/400.css'
import '@fontsource/source-serif-pro/600.css'
import '@fontsource/source-serif-pro/700.css'
import '@fontsource/source-serif-pro/900.css'

import './editor-variables.css'
import './editor.css'

import { DragAndDrop } from './components/dragndrop'
import { withInline } from './with/inline'
import { calculateStats, handleChange } from '../../lib/index'
import { Footer } from './components/footer/footer'

import { StandardPlugins } from './standardPlugins'
import { Registry } from './registry'
import { Element } from './components/element/element'
import { Leaf } from './components/leaf/leaf'
import { toggleLeaf } from './standardPlugins/leaf/leaf'
import { withInsertText } from './with/insertText'
import { withNormalizeNode } from './with/normalizeNode'
import { Hook, InputEventFunction } from '../../types'
import { withEditableVoids } from './with/editableVoids'
import { ContentToolbar } from './components/toolbar/content'
import { InlineToolbar } from './components/toolbar/inline'
import { withInsertBreak } from './with/insertBreak'
import { withInsertHtml } from './with/insertHtml'

interface EditorProps {
    onChange?: (value: Descendant[]) => void
    value: Descendant[]
    hooks?: Hook[]
}

StandardPlugins.forEach(Registry.addPlugin)


export default function Editor({ value, onChange, hooks }: EditorProps) {
    const inValue = value || [{
        id: uuid.v4(),
        name: "paragraph",
        class: "text",
        children: [
            { text: "" }
        ]
    }]

    useMemo(() => {
        Registry.registerHooks(hooks || [])
        // StandardPlugins.forEach(Registry.addPlugin)
    }, [])

    const editor = useMemo<ReactEditor>(() => {
        const editor = createEditor()
        withReact(editor)
        withHistory(editor)
        withInline(editor)
        withInsertText(editor, Registry.events.filter(event => event.on === 'input').map((event) => event.handler as InputEventFunction))
        withNormalizeNode(editor, Registry.normalizers)
        withEditableVoids(editor, value, Registry)
        withInsertBreak(editor)
        withInsertHtml(editor)

        return editor
    }, [])

    const [stats, setStats] = useState([0, 0])
    useEffect(() => {
        setStats(calculateStats(editor))
    }, [])

    const renderElement = useCallback(Element, [])
    const renderLeaf = useCallback(Leaf, [])

    return (
        <div className="mimer mimer-editor bg-base-10 fg-base">
            <DragAndDrop>

                <Slate editor={editor} value={inValue} onChange={(value) => {
                    handleChange(editor, onChange || null, value)
                    setStats(calculateStats(editor))
                }}>

                    <InlineToolbar
                        actions={Registry.actions.filter(a => ['leaf', 'inline'].includes(a.class))}
                    />
                    <ContentToolbar
                        actions={Registry.actions.filter(a => a.class !== 'leaf')}
                    />

                    <Editable
                        // style={{ minHeight: expandHeight ? '100%' : 'auto' }}
                        renderElement={props => renderElement(props, Registry.elementRenderers)}
                        renderLeaf={props => renderLeaf(props)}
                        onKeyDown={event => {
                            for (const action of Registry.actions) {
                                if (!action.isHotkey(event)) {
                                    continue
                                }

                                event.preventDefault()

                                if (action.handler && true !== action.handler(editor)) {
                                    break
                                }

                                if (action.class === 'leaf') {
                                    toggleLeaf(editor, action.name)
                                }
                                else if (action.class === 'text') {
                                    // FIXME: Should not allow transforming blocks (only text class element)
                                    Transforms.setNodes(
                                        editor,
                                        { type: action.name },
                                        { match: n => SlateElement.isElement(n) && SlateEditor.isBlock(editor, n) }
                                    )
                                }
                                break
                            }
                        }}
                        decorate={([node, path]) => {
                            // Display decoration when node is not the editor,
                            // when node is empty, and selection current and collapsed
                            if (editor.selection != null) {
                                if (
                                    !SlateEditor.isEditor(node) &&
                                    SlateEditor.string(editor, [path[0]]) === "" &&
                                    Range.includes(editor.selection, path) &&
                                    Range.isCollapsed(editor.selection) &&
                                    SlateElement.isElement(node)
                                ) {
                                    const renderer = Registry.elementRenderers.find(r => r.type === node.type)
                                    return [
                                        {
                                            ...editor.selection,
                                            placeholder: renderer?.placeholder || '',
                                        }
                                    ]
                                }
                            }
                            return []
                        }}
                    />

                </Slate>

            </DragAndDrop>
            <Footer stats={{ words: stats[0], characters: stats[1] }} />
        </div>
    )
}