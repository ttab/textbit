import { TextElement } from './TextElement'
import { Bold, Italic, Underline } from "./Leafs"
import { Navigation } from "./Navigation"
import { Loader } from "./Loader"


export const StandardPlugins = [
  TextElement,
  Bold,
  Italic,
  Underline
]

export const basePlugins = [
  Navigation,
  Loader
]
