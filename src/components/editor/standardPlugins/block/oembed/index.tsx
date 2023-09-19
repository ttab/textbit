import React from 'react' // Necessary for esbuild
import { useState, useEffect } from 'react'
import { Editor, Element, NodeEntry, Transforms } from 'slate'
import * as uuid from 'uuid'

import { convertLastSibling } from '../../../../../lib/utils'
import { ConsumeFunction, ConsumesFunction, MimerPlugin, RenderElementProps } from '../../../types'

// FIXME: Should expose its own type
//
// type OembedVideoProperties = {
//     properties: {
//         url: string
//     }
// }
// type OembedElement = Element & OembedVideoProperties

const SUPPORTED_OEMBED_URLS = [
    {
        url: 'open.spotify.com',
        endpoint: 'https://open.spotify.com/oembed?url=' // rich
    },
    {
        url: 'youtube.com/watch',
        endpoint: 'https://www.youtube.com/oembed?format=json&url=' // video
    },
    {
        url: 'vimeo.com',
        endpoint: 'https://vimeo.com/api/oembed.json?url=' // video
    },
    {
        url: 'gfycat.com',
        endpoint: 'https://api.gfycat.com/v1/oembed?url=' // video
    },
    {
        url: 'soundcloud.com',
        endpoint: 'https://soundcloud.com/oembed?url=' // rich
    },
    {
        url: 'on.soundcloud.com',
        endpoint: 'https://soundcloud.com/oembed?url=' // righ
    },
    {
        url: 'soundcloud.app.goog.gl',
        endpoint: 'https://soundcloud.com/oembed?url=' // rich
    },
    {
        url: 'tiktok.com',
        endpoint: 'https://www.tiktok.com/oembed?url=' // video
    },
    // {
    //     url: 'play.acast.com',
    //     endpoint: 'https://oembed.acast.com/v1/embed-player?url=' // rich, cors!
    // },
    // {
    //     url: 'giphy.com/gifs',
    //     endpoint: 'https://giphy.com/services/oembed?url=' // cors!
    // },
    // {
    //     url: 'giphy.com/clips',
    //     endpoint: 'https://giphy.com/services/oembed?url=' // cors!
    // },
    // {
    //     url: 'gph.is',
    //     endpoint: 'https://giphy.com/services/oembed?url=' // cors!
    // },
    // {
    //     url: 'pinterest.',
    //     endpoint: 'https://www.pinterest.com/oembed.json?url=' // rich, cors!
    // }
]

const render = ({ children }: RenderElementProps) => {
    const style = {
        minHeight: '10rem'
    }

    return <div style={style} draggable={false}>
        {children}
    </div>
}

const renderVideo = ({ children, attributes, rootNode }: RenderElementProps) => {
    const { properties = {} } = Element.isElement(rootNode) ? rootNode : {}
    const src = properties?.src || ''
    const html = properties?.html || ''
    const h = properties?.height as number ?? 1
    const w = properties?.width as number ?? 1

    const [classes, setClasses] = useState('appear-transitions appear-dimmed')
    const [heightRatio, setHeightRatio] = useState(0)

    useEffect(() => {
        setClasses('appear-transitions')
        setHeightRatio(Math.ceil((h / w) * 100))
    }, [])

    return (
        <div contentEditable={false} {...attributes}>
            <div className={classes} style={{ position: 'relative' }}>
                {!src && html &&
                    <div dangerouslySetInnerHTML={{ __html: html as string }} />
                }

                {src &&
                    <div style={{
                        padding: `${heightRatio || 50}% 0 0 0`,
                        position: 'relative',
                    }}>
                        <iframe
                            src={`${src}?title=0&byline=0&portrait=0`}
                            style={{
                                position: 'absolute',
                                top: '0',
                                left: '0',
                                width: '100%',
                                height: '100%',
                                border: 0
                            }}
                        />
                    </div>
                }

                {!src && !html &&
                    <div style={{ textAlign: 'center', margin: '0 auto', position: 'relative', backgroundColor: '#eee' }}>
                        <div className="rounded" style={{ position: 'absolute', top: '10px', left: '10px', background: '#000', opacity: '0.5', padding: '2px 8px' }}>
                            <a
                                href={properties?.original_url as string}
                                style={{ color: '#eee' }}
                                className="no-underline"
                                target="_blank"
                            >
                                {properties?.provider_name}
                                <span className="material-icons-round text-xs" style={{ paddingLeft: '6px' }}>open_in_new</span>
                            </a>
                        </div>
                        <img src={properties?.thumbnail_url as string} style={{ maxHeight: '400px' }} />
                    </div>
                }
            </div>
            {children}
        </div>
    )
}

const renderTitle = ({ children }: RenderElementProps) => {
    return <div className="text-sans-serif" style={{
        padding: '0.4rem 0.8rem',
        fontSize: '1rem',
        textAlign: 'center',
        opacity: '0.85',
        fontWeight: '400'
    }}>
        <span>{children}</span>
    </div>
}

const consumes: ConsumesFunction = ({ input }) => {
    const { data, type } = input

    if (!['text/uri-list', 'text/plain'].includes(type)) {
        return [false]
    }

    const oembedurl = getOembedUrl(data)
    return [oembedurl ? true : false, 'core/oembed']
}

const consume: ConsumeFunction = async ({ input }) => {
    if (Array.isArray(input)) {
        throw new Error('Oembed plugin expected string for consumation, not a list/array')
    }

    if (typeof input.data !== 'string') {
        throw new Error('Oembed plugin expected string for consumation, wrong indata')
    }

    const oEmbed = await fetchOembed(input.data)
    return oEmbed ? createOembedNode(oEmbed) : undefined
}

const createOembedNode = (props: any): Element => {
    return {
        id: uuid.v4(),
        class: 'block',
        type: 'core/oembed',
        properties: {
            type: props.type,
            provider_name: props.provider_name,
            original_url: props.original_url,
            url: '',
            src: props.src,
            title: props.title,
            html: props.html,
            width: props.width,
            height: props.height,
            thumbnail_url: props.thumbnail_url || '',
            thumbnail_width: props.thumbnail_width || 0,
            thumbnail_height: props.thumbnail_height || 0
        },
        children: [
            {
                type: 'core/oembed/embed',
                children: [{ text: '' }]
            },
            {
                type: 'core/oembed/title',
                children: [{ text: props.title }]
            }
        ]
    }
}

const fetchOembed = (url: string): Promise<{ [key: string]: string } | undefined> => {
    const oembedUrl = getOembedUrl(url)
    if (!oembedUrl) {
        return Promise.resolve(undefined)
    }

    return new Promise((resolve) => {
        fetch(`${oembedUrl}${encodeURI(url)}`)
            .then(response => response.json())
            .then(obj => {

                if (!obj || !obj.html) {
                    resolve(undefined)
                    return
                }

                let src = ''
                let html = obj.html

                // YouTube and Vimeo is better to extract and create your own iframe
                if (obj.provider_name === 'YouTube' || obj.provider_name === 'Vimeo') {
                    const matches = obj.html.match(/src="([^"]*)"/) || []
                    src = matches?.length === 2 ? matches[1] : ''
                }

                // TikToks html/js does not work, ignore it and use thumbnail
                if (obj.provider_name === 'TikTok') {
                    html = ''
                }

                resolve({
                    type: obj.type, // Required
                    original_url: url, // Internal, not part of oembed spec
                    title: obj.title || '', // Optional
                    url: obj.url || '', // Required for photo, otherwise optional)
                    src, // Internal iframe hack not part of embed
                    html, // Required for video, otherwise optional
                    width: obj.width, // Required
                    height: obj.height, // Required
                    provider_name: obj.provider_name, // Required
                    thumbnail_url: obj.thumbnail_url || '', // Optional
                    thumbnail_width: obj.thumbnail_width || 0, // Optional
                    thumbnail_height: obj.thumbnail_height || 0 // Optional
                })
            })
            .catch(ex => {
                console.warn(`Could not fetch Oembed from ${url}`, ex)
                resolve(undefined)
            })
    })
}

const getOembedUrl = (url: string): string | undefined => {
    const cleanUrl = url.replace(/^https?:\/\/(www.)?/, '')

    return SUPPORTED_OEMBED_URLS.find(s => cleanUrl.startsWith(s.url))?.endpoint || undefined
}

const onNormalizeNode = (editor: Editor, entry: NodeEntry) => {
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
    const titles = node.children.filter((child: any) => child?.type === 'core/oembed/title')
    if (Array.isArray(titles) && titles.length > 1) {
        return convertLastSibling(editor, node, path, 'core/oembed/title', 'core/paragraph')
    }

    // Syncronizing editable child "title" to property. Not necessary anymore but
    // saving this as an example for now/the future, while thinking about this more...
    //
    // const title = Node.string(titles[0])
    // if (title !== node?.properties?.title) {
    //     Transforms.setNodes(
    //         editor,
    //         {
    //             properties: {
    //                 ...node.properties,
    //                 title: title
    //             }
    //         },
    //         {
    //             at: path
    //         }
    //     )
    // }
}

export const OembedVideo: MimerPlugin = {
    class: 'block',
    name: 'core/oembed',
    consumer: {
        consumes,
        consume
    },
    events: {
        onNormalizeNode
    },
    component: {
        render,
        children: [
            {
                type: 'embed',
                class: 'void',
                render: renderVideo
            },
            {
                type: 'title',
                render: renderTitle
            }
        ]
    }
}