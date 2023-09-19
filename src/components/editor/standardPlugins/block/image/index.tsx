import React, { ChangeEvent } from 'react' // (React is ecessary for esbuild)
import { useEffect, useRef } from 'react'
import { Transforms, Element, Editor, NodeEntry } from 'slate'
import * as uuid from 'uuid'

import { convertLastSibling } from '../../../../../lib/utils'
import './index.css'
import { BsImage } from 'react-icons/bs'
import { triggerFileInputEvent } from '../../../../../lib/hookableEvents'
import { ConsumeFunction, ConsumesFunction, MimerActionHandlerProps, MimerPlugin, RenderElementProps } from '../../../types'

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
            <div ref={imgContainerRef} className='mimer-image-container appear-transitions appear-dimmed'>
                <img width='100%' src={src} />
            </div>
            {children}
        </div>
    )
}

const renderAltText = ({ children }: RenderElementProps) => {
    return <div draggable={true} className="text-sans-serif" style={{
        padding: '0.4rem 0.8rem',
        fontSize: '1rem',
        textAlign: 'center',
        opacity: '0.85',
        fontWeight: '400'
    }}>
        <figcaption>{children}</figcaption>
    </div>
}

const renderText = ({ children }: RenderElementProps) => {
    return <div draggable={true} className="text-sans-serif" style={{
        padding: '0.4rem 0.8rem',
        fontSize: '1rem',
        textAlign: 'center',
        opacity: '0.85',
        fontWeight: '400'
    }}>
        <figcaption>{children}</figcaption>
    </div>
}


const onNormalizeNode = (editor: Editor, entry: NodeEntry) => {
    const [node, path] = entry
    if (!Element.isElement(node)) {
        return
    }

    // If any child element (parent el + 2 children) is missing, remove all
    if (node.children.length < 3) {
        Transforms.removeNodes(editor, { at: [path[0]] })
        return true
    }

    // Remove excess altText (only one allowed)
    const altTexts = node.children.filter((child: any) => child?.type === 'core/image/text')
    if (Array.isArray(altTexts) && altTexts.length > 1) {
        // FIXME: Merge all altTexts into one. It should be just one
        return true
    }

    // Remove excess text (only one allowed)
    const texts = node.children.filter((child: any) => child?.type === 'core/image/text')
    if (Array.isArray(texts) && texts.length > 1) {
        convertLastSibling(editor, node, path, 'core/image/text', 'core/paragraph')
        return true
    }

    return true
}

const actionHandler = ({ editor }: MimerActionHandlerProps): boolean => {
    let fileSelector: HTMLInputElement | undefined = document.createElement('input')

    fileSelector.accept = "image/jpg, image/gif, image/png";
    fileSelector.setAttribute('type', 'file')
    fileSelector.setAttribute('multiple', 'multiple')

    fileSelector.addEventListener('change', (e: unknown) => {
        const event: ChangeEvent<HTMLInputElement> = e as ChangeEvent<HTMLInputElement>

        if (event.target.files?.length) {
            // Trigger native file input 
            triggerFileInputEvent(editor, event)
        }

        setTimeout(() => {
            fileSelector = undefined
        }, 0)
    })

    fileSelector.click()

    return true
}

const consumes: ConsumesFunction = ({ type, input: data }) => {
    if (!(data instanceof File)) {
        return [false]
    }
    const { size } = data

    if (!['image/png', 'image/jpg', 'image/jpeg', 'image/gif'].includes(type)) {
        console.warn(`Image mime type ${type} not supported`)
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
                                children: [{ text: '' }]
                            },
                            {
                                type: 'core/image/altText',
                                children: [{ text: name }]
                            },
                            {
                                type: 'core/image/text',
                                children: [{ text: '' }]
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

export const Image: MimerPlugin = {
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
            handler: actionHandler
        }
    ],
    events: {
        onNormalizeNode
    },
    component: {
        render,
        children: [
            {
                type: 'image',
                class: 'void',
                render: renderImage
            },
            {
                type: 'altText',
                render: renderAltText
            },
            {
                type: 'text',
                render: renderText
            }
        ]
    }
}