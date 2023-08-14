import React, { ChangeEvent } from 'react' // Necessary for esbuild
import { useEffect, useRef } from 'react'
import { Node, Transforms, Element } from 'slate'
import * as uuid from 'uuid'

import { ActionFunction, DropEventFunction, DropMatchFunction, FileInputEventFunction, FileInputMatchFunction, MimerPlugin, NormalizeFunction, RenderFunction } from '../../../../../types'
import { convertLastSibling } from '../../../../../lib/utils'
import './index.css'
import { BsImage } from 'react-icons/bs'
import { triggerFileInputEvent } from '../../../../../lib/hookableEvents'

// FIXME: Should expose its own type
//
// type ImageProperties = {
//     properties: {
//         src: string
//         type: string
//         title?: string
//         size: number
//         width: number
//         height: number
//     }
// }
//
// type ImageElement = Element & ImageProperties

const render: RenderFunction = ({ children }) => {
    const style = {
        minHeight: '10rem',
        margin: '0'
    }

    return <figure style={style} draggable={false}>
        {children}
    </figure>
}

const renderImage: RenderFunction = ({ children, attributes, parent }) => {
    const { properties = {} } = parent
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

const renderTitle: RenderFunction = ({ children, parent }) => {
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

const dropMatcher: DropMatchFunction = (event) => {
    // Does not support urls right now
    if (typeof event === 'string') {
        return false
    }

    const files = event.nativeEvent?.dataTransfer?.files
    if (!files || !files.length) {
        return false
    }

    // FIXME: Must loop
    const name = files[0].name
    const size = files[0].size
    const type = files[0].type

    if (!['image/png', 'image/jpg', 'image/jpeg', 'image/gif'].includes(type)) {
        console.warn(`Image mime type ${type} not supported`)
        return false
    }

    // Hardcoded limit on 30 MB
    if (size / 1024 / 1024 > 30) {
        console.warn(`Image is too large, ${size / 1024 / 1024}, max 30 Mb allowed`)
        return false
    }

    return true
}

const fileMatcher: FileInputMatchFunction = (event) => {
    const files = event.target?.files
    if (!files || !files.length) {
        return false
    }

    // FIXME: must loop
    const name = files[0].name
    const size = files[0].size
    const type = files[0].type

    if (!['image/png', 'image/jpg', 'image/jpeg', 'image/gif'].includes(type)) {
        console.warn(`Image mime type ${type} not supported`)
        return false
    }

    // Hardcoded limit on 30 MB
    if (size / 1024 / 1024 > 30) {
        console.warn(`Image is too large, ${size / 1024 / 1024}, max 30 Mb allowed`)
        return false
    }

    return true
}

const fileHandler: FileInputEventFunction = (editor, event, objects) => {
    if (!Array.isArray(objects)) {
        return Promise.resolve([])
    }

    return Promise.resolve(
        objects.map(object => {
            return {
                id: uuid.v4(),
                class: 'block',
                name: 'image',
                properties: {
                    type: object.type,
                    src: object.src,
                    title: object.title,
                    size: object.size,
                    width: object.width,
                    height: object.height
                },
                children: [
                    {
                        name: 'image--image',
                        children: [{ text: '' }]
                    },
                    {
                        name: 'image--title',
                        children: [{ text: name }]
                    }
                ]
            }
        })
    )
}


const dropHandler: DropEventFunction = (editor, event, objects) => {
    if (Array.isArray(objects)) {
        return Promise.resolve(
            objects.map(object => {
                return {
                    id: uuid.v4(),
                    class: 'block',
                    name: 'image',
                    properties: {
                        type: object.type,
                        src: object.src,
                        title: object.title,
                        size: object.size,
                        width: object.width,
                        height: object.height
                    },
                    children: [
                        {
                            name: 'image--image',
                            children: [{ text: '' }]
                        },
                        {
                            name: 'image--title',
                            children: [{ text: name }]
                        }
                    ]
                }
            })
        )
    }

    // Store base64 in document, for local testing only
    const files = event.dataTransfer.files

    const src = event.dataTransfer.getData('text/uri-list')
    const file = files.length ? files[0] : null

    if (!src && !file) {
        return Promise.reject('Missing parameters')
    }


    return new Promise((resolve, reject) => {
        const { name, size, type } = files[0]
        const reader = new FileReader();

        reader.addEventListener("load", () => {

            const tmpImage = new window.Image()
            tmpImage.src = reader.result as string
            tmpImage.onload = function () {
                resolve([{
                    id: uuid.v4(),
                    class: 'block',
                    name: 'image',
                    properties: {
                        type: type,
                        src: reader.result,
                        title: name,
                        size: size,
                        width: tmpImage.width,
                        height: tmpImage.height
                    },
                    children: [
                        {
                            name: 'image--image',
                            children: [{ text: '' }]
                        },
                        {
                            name: 'image--title',
                            children: [{ text: name }]
                        }
                    ]
                }])
            }
        }, false);

        if (file) {
            reader.readAsDataURL(file);
        }
    })
}


const normalize: NormalizeFunction = (editor, entry) => {
    const [node, path] = entry
    if (!Element.isElement(node)) {
        return
    }

    // If any child element (parent el + 2 children) is missing, remove all
    if (node.children.length < 2) {
        Transforms.removeNodes(editor, { at: [path[0]] })
        return
    }

    // Remove excess titles (only one allowed)
    const titles = node.children.filter((child: any) => child?.name === 'image--title')
    if (Array.isArray(titles) && titles.length > 1) {
        return convertLastSibling(editor, node, path, 'image--title', 'paragraph')
    }

    const title = Node.string(titles[0])
    if (title !== node?.properties?.title) {
        Transforms.setNodes(
            editor,
            {
                properties: {
                    ...node.properties,
                    title: title
                }
            },
            {
                at: path
            }
        )
    }
}

const actionHandler: ActionFunction = (editor) => {
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
}

export const Image: MimerPlugin = {
    class: 'block',
    name: 'image',
    events: [
        {
            on: 'drop',
            match: dropMatcher,
            handler: dropHandler
        },
        {
            on: 'fileinput',
            match: fileMatcher,
            handler: fileHandler
        }
    ],
    actions: [
        {
            title: 'Image',
            tool: <BsImage />,
            handler: actionHandler
        }
    ],
    normalize,
    components: [
        {
            render
        },
        {
            name: 'image',
            class: 'void',
            render: renderImage
        },
        {
            name: 'title',
            render: renderTitle
        }
    ]
}