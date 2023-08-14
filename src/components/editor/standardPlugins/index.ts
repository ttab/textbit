import { Element, Node } from "slate"
import { Blockquote } from "./textblock/blockquote"
import { Paragraph } from './text/paragraph'
import { Title } from './text/title'
import { Dateline } from './text/dateline'
import { Leadin } from './text/leadin'
import { Bold, Italic, Underline } from "./leaf/leaf"
import { Navigation } from "./generic/navigation"
import { OembedVideo } from "./block/oembed"
import { Image } from "./block/image"
import { Quotes } from "./generic/quotes"
import { Loader } from "./void/loader"
import { Link } from './inline/link'

const isBlock = (node: Node) => {
    return Element.isElement(node) && node.class === 'block'
}

const isTextBlock = (node: Node) => {
    return Element.isElement(node) && node.class === 'textblock'
}

const isText = (node: Node) => {
    return Element.isElement(node) && node.class === 'text'
}

const isVoid = (node: Node) => {
    return Element.isElement(node) && node.class === 'void'
}

const isInline = (node: Node) => {
    return Element.isElement(node) && node.class === 'inline'
}

const hasName = (node: Node, name: string) => {
    return Element.isElement(node) && node?.name === name
}

const hasId = (node: Node, id: string) => {
    return Element.isElement(node) && node?.id === id
}

export const MimerElement = {
    ...Element,
    isBlock,
    isTextBlock,
    isText,
    isVoid,
    isInline,
    hasName,
    hasId
}

export const StandardPlugins = [
    Paragraph,
    Title,
    Leadin,
    Dateline,
    Blockquote,
    Bold,
    Italic,
    Underline,
    Navigation,
    OembedVideo,
    Quotes,
    Image,
    Loader,
    Link
]