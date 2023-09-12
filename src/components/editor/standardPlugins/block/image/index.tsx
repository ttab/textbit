import React, { ChangeEvent } from 'react' // (React is ecessary for esbuild)
import { useEffect, useRef } from 'react'
import { Transforms, Element } from 'slate'
import * as uuid from 'uuid'

import { convertLastSibling } from '../../../../../lib/utils'
import './index.css'
import { BsImage } from 'react-icons/bs'
import { triggerFileInputEvent } from '../../../../../lib/hookableEvents'
import { ConsumeFunction, ConsumesFunction, MimerPlugin, RenderElementProps } from '../../../types'

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

// const dropMatcher = (event) => {
//     if (event.type !== 'drop') {
//         return false
//     }

//     const nativeEvent = event.nativeEvent as DragEvent
//     const files = nativeEvent.dataTransfer?.files
//     if (!files || !files.length) {
//         return false
//     }

//     // FIXME: Must loop
//     const name = files[0].name
//     const size = files[0].size
//     const type = files[0].type

//     if (!['image/png', 'image/jpg', 'image/jpeg', 'image/gif'].includes(type)) {
//         console.warn(`Image mime type ${type} not supported`)
//         return false
//     }

//     // Hardcoded limit on 30 MB
//     if (size / 1024 / 1024 > 30) {
//         console.warn(`Image is too large, ${size / 1024 / 1024}, max 30 Mb allowed`)
//         return false
//     }

//     return true
// }

// const fileMatcher = (event) => {
//     if (event.type !== 'drop') {
//         return false
//     }

//     const nativeEvent = event.nativeEvent as DragEvent
//     const files = nativeEvent.dataTransfer?.files
//     if (!files || !files.length) {
//         return false
//     }

//     // FIXME: must loop
//     const name = files[0].name
//     const size = files[0].size
//     const type = files[0].type

//     if (!['image/png', 'image/jpg', 'image/jpeg', 'image/gif'].includes(type)) {
//         console.warn(`Image mime type ${type} not supported`)
//         return false
//     }

//     // Hardcoded limit on 30 MB
//     if (size / 1024 / 1024 > 30) {
//         console.warn(`Image is too large, ${size / 1024 / 1024}, max 30 Mb allowed`)
//         return false
//     }

//     return true
// }

// const fileHandler = (editor, event, objects) => {
//     if (!Array.isArray(objects)) {
//         return Promise.resolve([])
//     }

//     return Promise.resolve(
//         objects.map(object => {
//             return {
//                 id: uuid.v4(),
//                 class: 'block',
//                 type: 'core/image',
//                 properties: {
//                     type: object.type,
//                     src: object.src,
//                     size: object.size,
//                     width: object.width,
//                     height: object.height
//                 },
//                 children: [
//                     {
//                         type: 'core/image/image',
//                         children: [{ text: '' }]
//                     },
//                     {
//                         type: 'core/image/altText',
//                         children: [{ text: object.src }]
//                     },
//                     {
//                         type: 'core/image/text',
//                         children: [{ text: '' }]
//                     }
//                 ]
//             }
//         })
//     )
// }


// const dropHandler = (editor, event, objects): Promise<Element[]> => {

//     if (Array.isArray(objects)) {
//         return Promise.resolve(
//             objects.map((object): Element => {
//                 return {
//                     id: uuid.v4(),
//                     class: 'block',
//                     type: 'core/image',
//                     properties: {
//                         type: object.type,
//                         src: object.src,
//                         size: object.size,
//                         width: object.width,
//                         height: object.height
//                     },
//                     children: [
//                         {
//                             type: 'core/image/image',
//                             children: [{ text: '' }]
//                         },
//                         {
//                             type: 'core/image/altText',
//                             children: [{ text: object.src }]
//                         },
//                         {
//                             type: 'core/image/text',
//                             children: [{ text: '' }]
//                         }
//                     ]
//                 }
//             })
//         )
//     }

//     // Store base64 in document, for local testing only
//     const files = event.dataTransfer.files

//     const src = event.dataTransfer.getData('text/uri-list')
//     const file = files.length ? files[0] : null

//     if (!src && !file) {
//         return Promise.reject('Missing parameters')
//     }


//     return new Promise((resolve, reject) => {
//         const { name, size, type } = files[0]
//         const reader = new FileReader();

//         reader.addEventListener("load", () => {

//             if (typeof reader.result !== 'string') {
//                 reject(`Error when image dropped, resulted in ${typeof reader.result}`)
//                 return
//             }

//             const tmpImage = new window.Image()
//             tmpImage.src = reader.result
//             tmpImage.onload = function () {
//                 resolve([{
//                     id: uuid.v4(),
//                     class: 'block',
//                     type: 'core/image',
//                     properties: {
//                         type: type,
//                         src: tmpImage.src,
//                         title: name,
//                         size: size,
//                         width: tmpImage.width,
//                         height: tmpImage.height
//                     },
//                     children: [
//                         {
//                             type: 'core/image/image',
//                             children: [{ text: '' }]
//                         },
//                         {
//                             type: 'core/image/altText',
//                             children: [{ text: name }]
//                         },
//                         {
//                             type: 'core/image/text',
//                             children: [{ text: '' }]
//                         }
//                     ]
//                 }])
//             }
//         }, false);

//         if (file) {
//             reader.readAsDataURL(file);
//         }
//     })
// }


const normalize = (editor, entry) => {
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
    const titles = node.children.filter((child: any) => child?.name === 'core/image/title')
    if (Array.isArray(titles) && titles.length > 1) {
        return convertLastSibling(editor, node, path, 'core/image/title', 'core/paragraph')
    }
}

const actionHandler = ({ editor }) => {
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

const consumes: ConsumesFunction = ({ data }) => {
    if (!(data instanceof File)) {
        return [false]
    }
    const { size, type }: File = data

    if (!['image/png', 'image/jpg', 'image/jpeg', 'image/gif'].includes(type)) {
        console.warn(`Image mime type ${type} not supported`)
        return [false]
    }

    // Hardcoded limit on 30 MB
    if (size / 1024 / 1024 > 30) {
        console.warn(`Image is too large, ${size / 1024 / 1024}, max 30 Mb allowed`)
        return [false]
    }

    return [true, 'core/image']
}

/**
 * Consume a FileList and produce an array of core/image objects
 */
const consume: ConsumeFunction = ({ data }) => {
    if (!Array.isArray(data)) {
        throw new Error('Expected FileList for consumation, wrong indata')
    }

    const readers = []
    for (const f of data) {
        const { name, type, size } = f

        readers.push(new Promise((resolve, reject) => {
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

            reader.readAsDataURL(f)
        }))

    }

    return Promise.all(readers)
}

export const Image: MimerPlugin = {
    class: 'block',
    name: 'core/image',
    consumer: {
        bulk: false, // Can be omitted as false is default
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
    // normalize,
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