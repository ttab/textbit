import React, { ChangeEvent } from 'react' // (React is ecessary for esbuild)
import { useEffect, useRef } from 'react'
import { Transforms, Element, Editor, NodeEntry } from 'slate'
import * as uuid from 'uuid'

import './index.css'
import { BsImage } from 'react-icons/bs'
import { ConsumeFunction, ConsumesFunction, TextbitActionHandlerProps, TextbitPlugin, RenderElementProps } from '../../../../../types'
import { pipeFromFileInput } from '../../../../../lib/pipes'
import { Node } from 'slate'
import { TextbitElement } from '@/lib/textbit-element'

// FIXME: Should expose its own type
//
// type ImageProperties = {
//     properties: {
//         src: string
//         type: string
//         altText: string
//         text?: string
//         size: number
//         width: number
//         height: number
//     }
// }
//
// type ImageElement = Element & ImageProperties

const render = ({ children }: RenderElementProps) => {
    const style = {
        minHeight: '10rem',
        margin: '0'
    }

    return <figure style={style} draggable={false}>
        {children}
    </figure>
}

const renderImage = ({ children, attributes, rootNode }: RenderElementProps) => {
    const { properties = {} } = Element.isElement(rootNode) ? rootNode : {}
    const src: string = properties?.src as string || ''
    const h = properties?.height ?? 1
    const w = properties?.width ?? 1
    const imgContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!imgContainerRef?.current) {
            return
        }
        imgContainerRef.current.classList.remove('appear-dimmed')
    }, [])

    return (
        <div contentEditable={false} {...attributes} draggable={false}>
            <div ref={imgContainerRef} className='textbit-image-container appear-transitions appear-dimmed'>
                <img width='100%' src={src} />
            </div>
            {children}
        </div>
    )
}

const renderText = ({ children }: RenderElementProps) => {
    return <div draggable={false} className="text-serif text-sm italic r-less b-weak" style={{
        marginTop: '0.5rem',
        padding: '0.5rem 0.5rem',
        opacity: '0.85',
        background: 'rgba(201, 201, 201, 0.3)',
        display: 'flex'
    }}>
        <label
            contentEditable={false}
            className="text-sans-serif text-xs font-light not-italic"
            style={{
                flex: '0 0 45px',
                alignSelf: 'center'
            }}
        >Text:</label>
        <figcaption>{children}</figcaption>
    </div>
}


const renderAltText = ({ children }: RenderElementProps) => {
    return <div draggable={false} className="text-sans-serif text-sm center" style={{
        marginTop: '0.5rem',
        padding: '0.5rem 0.5rem',
        opacity: '0.85',
        background: 'rgba(201, 201, 201, 0.3)',
        display: 'flex'
    }}>
        <label
            contentEditable={false}
            className="text-sans-serif text-xs font-light not-italic"
            style={{
                flex: '0 0 45px',
                alignSelf: 'center'
            }}
        >Alt:</label>
        <figcaption>{children}</figcaption>
    </div>
}

const normalizeImage = (editor: Editor, nodeEntry: NodeEntry) => {
    const [node, path] = nodeEntry
    const children = Array.from(Node.children(editor, path))

    if (children.length < 3) {
        
        let hasAltText = false
        let hasText = false
        let hasImage = false
        
        for (const [child] of children) {
            if (!Element.isElement(child)) {
                continue
            }

            if (child.type === 'core/image/image') {
                hasImage = true
            }

            if (child.type === 'core/image/altText') {
                hasAltText = true
            }

            if (child.type === 'core/image/text') {
                hasText = true
            }
        }

        if (!hasImage)  {
            // If image is gone, delete the whole block
            Transforms.removeNodes(editor, { at: path })
            return true
        }
        else if (!hasText || !hasAltText) {
            // If either text is missing, add empty text node in the right position
            const [addType, atPos] = (!hasAltText) ? ['core/image/altText', 2] : ['core/image/text', 1]
            Transforms.insertNodes(
                editor,
                {
                    id: uuid.v4(),
                    class: 'text',
                    type: addType,
                    children: [{ text: '' }]
                },
                { at: [...path, atPos] }
            )
            return true
        }
    }


    let n = 0
    for (const [child, childPath] of children) {
        if (TextbitElement.isBlock(child) || TextbitElement.isTextblock(child)) {
            // Unwrap block node children (move text element children upwards in tree)
            Transforms.unwrapNodes(editor, {
                at: childPath,
                split: true
            })
            return true
        }

        if (n === 1 && !TextbitElement.isOfType(child, 'core/image/text')) {
            Transforms.setNodes(
                editor,
                { type: 'core/image/text' },
                { at: childPath }
            )
            return true
        }

        if (n === 2 && !TextbitElement.isOfType(child, 'core/image/altText')) {
            Transforms.setNodes(
                editor,
                { type: 'core/image/altText' },
                { at: childPath }
            )
            return true
        }

        if (n > 2) {
            // Excessive nodes are lifted and transformed to text
            Transforms.setNodes(
                editor,
                {type: 'core/text', properties: {}},
                {at: childPath}
            )
            Transforms.liftNodes(
                editor,
                { at: childPath}
            )
        }
        n++
    }
}

const actionHandler = ({ editor }: TextbitActionHandlerProps): boolean => {
    let fileSelector: HTMLInputElement | undefined = document.createElement('input')

    fileSelector.accept = "image/jpg, image/gif, image/png";
    fileSelector.setAttribute('type', 'file')
    fileSelector.setAttribute('multiple', 'multiple')

    fileSelector.addEventListener('change', (e: unknown) => {
        const event: ChangeEvent<HTMLInputElement> = e as ChangeEvent<HTMLInputElement>

        if (event.target.files?.length) {
            pipeFromFileInput(editor, event)
        }

        setTimeout(() => {
            fileSelector = undefined
        }, 0)
    })

    fileSelector.click()

    return true
}

const consumes: ConsumesFunction = ({ input }) => {
    if (!(input.data instanceof File)) {
        return [false]
    }
    const { size, type } = input.data

    if (!['image/png', 'image/jpg', 'image/jpeg', 'image/gif'].includes(type)) {
        console.warn(`Image mime type ${input.type} not supported`)
        return [false]
    }

    // Hardcoded limit on 30 MB
    if (size / 1024 / 1024 > 30) {
        console.warn(`Image is too large, ${size / 1024 / 1024}, max 30 Mb allowed`)
        return [false]
    }

    return [true, 'core/image', false]
}

/**
 * Consume a FileList and produce an array of core/image objects
 */
const consume: ConsumeFunction = ({ input }) => {
    if (Array.isArray(input)) {
        throw new Error('Image plugin expected File for consumation, not a list/array')
    }

    if (true !== input.data instanceof File) {
        throw new Error('Image plugin expected File for consumation, wrong indata')
    }

    const { name, type, size } = input.data

    const readerPromise = new Promise((resolve, reject) => {
        const reader = new FileReader()

        reader.addEventListener('load', () => {
            if (typeof reader.result !== 'string') {
                reject(`Error when image dropped, resulted in ${typeof reader.result}`)
                return
            }

            const tmpImage = new window.Image()
            tmpImage.src = reader.result
            tmpImage.onload = function () {
                window.setTimeout(() => {
                    resolve({
                        id: uuid.v4(),
                        class: 'block',
                        type: 'core/image',
                        properties: {
                            type: type,
                            src: tmpImage.src,
                            title: name,
                            size: size,
                            width: tmpImage.width,
                            height: tmpImage.height
                        },
                        children: [
                            {
                                type: 'core/image/image',
                                class: 'text',
                                children: [{ text: '' }]
                            },
                            {
                                type: 'core/image/text',
                                class: 'text',
                                children: [{ text: '' }]
                            },
                            {
                                type: 'core/image/altText',
                                class: 'text',
                                children: [{ text: name }]
                            }
                        ]
                    })
                }, 1000)
            }

        }, false)

        reader.readAsDataURL(input.data)
    })

    return readerPromise
}

export const Image: TextbitPlugin = {
    class: 'block',
    name: 'core/image',
    consumer: {
        consumes,
        consume
    },
    actions: [
        {
            title: 'Image',
            tool: <BsImage />,
            handler: actionHandler,
            visibility: (element, rootElement) => {
                return [
                    true, // Always visible
                    true, // Always enabled
                    false // Never active
                ]
            }
        }
    ],
    component: {
        class: 'block',
        render,
        constraints: {
            normalizeNode: normalizeImage
        },
        children: [
            {
                type: 'image',
                class: 'void',
                render: renderImage
            },
            {
                type: 'altText',
                class: 'text',
                render: renderAltText
            },
            {
                type: 'text',
                class: 'text',
                render: renderText
            }
        ]
    }
}