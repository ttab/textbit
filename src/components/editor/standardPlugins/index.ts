import { Element, Node } from "slate"
import { Text } from './text/text'
import { Bold, Italic, Underline } from "./leaf/leaf"
import { Blockquote } from "./textblock/blockquote"
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

const isOfType = (node: Node, type: string) => {
    return Element.isElement(node) && node?.type === type
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
    isOfType,
    hasId
}

export const StandardPlugins = [
    Text,
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