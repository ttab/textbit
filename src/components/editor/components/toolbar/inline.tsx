import React from 'react' // Necessary for esbuild
import { PropsWithChildren, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useFocused, useSlate } from 'slate-react'
import { Editor, Range, Element as SlateElement, BaseRange, NodeEntry, Node } from 'slate'
import { Action } from '../../../../types'
import { toggleLeaf } from '../../standardPlugins/leaf/leaf'
import { isFromTarget } from '../../../../lib/target'
import './inline.css'

const Portal = ({ children }: PropsWithChildren) => {
    return typeof document === 'object'
        ? ReactDOM.createPortal(children, document.body)
        : null
}

type InlineToolbarProps = {
    actions: Action[]
}

type InlineToolProps = {
    action: Action
}

type AlternateInlineToolProps = {
    action: Action,
    node: NodeEntry<Node>
}

function handleVisibility(el: HTMLDivElement | null, editor: Editor, inFocus: boolean) {
    const selection = editor.selection

    const hide = () => {
        if (!el) { return }
        el.style.opacity = '0'
        el.style.top = '-10000px'
        el.style.left = '-10000px'
    }

    if (!el || !selection) {
        return hide()
    }

    // TODO: Inline/leaf plugins should be able to signal that they need to
    // have the inline menu visible. The link plugin must show it's href
    // etc witouth forcing the user to select the whoe link. This could
    // apply to other plugins as well. Right now this will always show the
    // inline toolbar if the selection is collapsed on an inline node.
    if (Range.isCollapsed(selection)) {
        const nodes = Array.from(Editor.nodes(editor, {
            at: selection,
            match: n => SlateElement.isElement(n) && n.class === 'inline'
        }))

        if (!nodes.length) {
            return hide()
        }
    }
    else if (!inFocus || Editor.string(editor, selection) === '') {
        return hide()
    }

    const domSelection = window.getSelection()
    if (!domSelection) {
        return hide()
    }

    const domRange = domSelection.getRangeAt(0)
    const rect = domRange.getBoundingClientRect()

    const newTop = rect.top + window.pageYOffset - el.offsetHeight
    const newLeft = rect.left + window.pageXOffset - el.offsetWidth / 2 + rect.width / 2

    if (newTop < 0 || newLeft < 0) {
        return
    }

    el.style.opacity = '1'
    el.style.top = `${rect.top + window.pageYOffset - el.offsetHeight}px`
    el.style.left = `${rect.left +
        window.pageXOffset -
        el.offsetWidth / 2 +
        rect.width / 2}px`
}


/**
 * Inline toolbar component
 */
export const InlineToolbar = ({ actions = [] }: InlineToolbarProps) => {
    const ref = useRef<HTMLDivElement>(null)
    const editor = useSlate()
    const inFocus = useFocused()

    useEffect(() => {
        const clickHandler = (e: MouseEvent) => {
            // Close inline menu when editor content menu is handled
            if (isFromTarget(e.target as HTMLElement, { className: 'editor-content-menu-anchor' })) {
                if (ref.current) {
                    ref.current.style.opacity = '0'
                }
            }
        }

        window.addEventListener('click', clickHandler, { passive: true })
        return () => { window.removeEventListener('click', clickHandler) }
    }, [])

    useEffect(() => {
        handleVisibility(ref?.current, editor, inFocus)
    })

    if (!editor.selection) {
        return <></>
    }


    const range = Editor.unhangRange(editor, editor.selection as BaseRange)
    const isCollapsed = Range.isCollapsed(range)

    const [inlineNode] = Array.from(Editor.nodes(editor, {
        at: editor.selection,
        match: n => SlateElement.isElement(n) && n.class === 'inline'
    }))

    const inlineEl = inlineNode && inlineNode.length ? inlineNode[0] : null
    const leafActions = actions.filter((action: Action) => action.tool && action.class === 'leaf')
    const inlineActions = actions.filter((action: Action) => action.tool && action.class === 'inline')
    const inlineNodeAction = actions.find((action: Action) => action.tool && SlateElement.isElement(inlineEl) && action.name === inlineEl?.type)

    return <Portal>
        <div
            ref={ref}
            className="mimer editor-inline-menu"
            onMouseDown={(e) => {
                // Prevent clicks (between tool groups) taking focus from editor
                e.preventDefault()
            }}
        >
            <div className="rounded bg-base-30 s-base-10 r-base b-weak" style={{ padding: '4px' }}>
                {(!isCollapsed || inlineNode) &&
                    <>
                        {/* First group contains normal leafs, but only if it is not collapsed */}
                        {!isCollapsed && leafActions.length > 0 &&
                            <ToolGroup>
                                {leafActions.map(action =>
                                    <ToolButton
                                        key={`${action.class}-${action.name}`}
                                        action={action}
                                    />
                                )}
                            </ToolGroup>
                        }

                        {/* Second group with normal inline tools if no inline nodes are selected */}
                        {!isCollapsed && !inlineNode && inlineActions.length > 0 &&
                            <ToolGroup>
                                {inlineActions.map(action =>
                                    <ToolButton
                                        key={`${action.class}-${action.name}`}
                                        action={action}
                                    />
                                )}
                            </ToolGroup>
                        }

                        {/* When just one inlime tool (second (del) and third tool (edit)) */}
                        {/*should be shown (if it has multiple tools) */}
                        {inlineNodeAction && isCollapsed && Array.isArray(inlineNodeAction.tool) &&
                            <ToolGroup>
                                <InlineTool
                                    key={`${inlineNodeAction.class}-${inlineNodeAction.name}`}
                                    action={inlineNodeAction}
                                    node={inlineNode}
                                />
                            </ToolGroup>
                        }

                    </>
                }
            </div>
            <div className="editor-inline-menu-arrow"></div>
        </div>
    </Portal>
}

export const ToolGroup = ({ children }: PropsWithChildren) => {
    return <div className="editor-tool-group">{children}</div>
}

/**
 * Inline toolbar button component
 */
const ToolButton = ({ action }: InlineToolProps) => {
    const editor = useSlate()
    const marks = Editor.marks(editor)
    const isActive = marks ? marks.formats?.includes(action.name) : false

    return <span
        className={`editor-tool r-less bg-base-hover`}
        onMouseDown={(e) => {
            e.preventDefault()
            if (true === action.handler(editor)) {
                toggleLeaf(editor, action.name)
            }
        }}
    >
        <>
            {!Array.isArray(action.tool) ? action.tool : action.tool[0]}
            <em className={`${isActive ? 'primary' : ''}`}></em>
        </>
    </span>
}


/**
 * Alternative inline toolbar button component (handles tool 1 and 2 in tool array)
 */
const InlineTool = ({ action, node }: AlternateInlineToolProps) => {
    const editor = useSlate()

    if (!Array.isArray(action.tool)) {
        return <></>
    }

    return <>
        {action.tool[1] && typeof action.tool[1] === 'function' &&
            <>{action.tool[1](editor, node)}</>
        }
    </>
}