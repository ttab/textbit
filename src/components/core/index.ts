import { TextElement } from './TextElement'
import { Bold, Italic, Underline } from "./Leafs"
import { BlockquotePlugin } from "./Blockquote"
import { Navigation } from "./Navigation"
import { OEmbed } from "./OEmbed"
import { Image } from "./Image"
import { Quotes } from "./Quotes"
import { Loader } from "./Loader"
import { Link } from './Link'


export const StandardPlugins = [
  TextElement,
  BlockquotePlugin,
  Bold,
  Italic,
  Underline,
  Navigation,
  OEmbed,
  Quotes,
  Image,
  Loader,
  Link
]
