import { TextElement } from './TextElement'
import { Bold, Italic, Underline } from "./Leafs"
import { Navigation } from "./Navigation"
import { OEmbed } from "./OEmbed"
import { Image } from "./Image"
import { Loader } from "./Loader"


export const StandardPlugins = [
  TextElement,
  Bold,
  Italic,
  Underline,
  Navigation,
  OEmbed,
  Image,
  Loader
]
