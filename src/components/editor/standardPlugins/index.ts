import { Text } from './text/text'
import { Bold, Italic, Underline } from "./leaf/leaf"
import { Blockquote } from "./textblock/blockquote"
import { Navigation } from "./generic/navigation"
import { OembedVideo } from "./block/oembed"
import { Image } from "./block/image"
import { Quotes } from "./generic/quotes"
import { Loader } from "./void/loader"
import { Link } from './inline/link'


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