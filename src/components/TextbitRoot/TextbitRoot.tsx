import React, { PropsWithChildren } from 'react' // Necessary for esbuild
import { TextbitContextProvider } from './TextbitContext'
import { PluginRegistryContextProvider } from '../PluginRegistry/PluginRegistryContext'
import { Plugin } from '../../types'

import {
  basePlugins,
  StandardPlugins
} from '@/components/core'
import { FocusContextProvider } from './FocusContext'


export const TextbitRoot = ({ children, verbose, debounce, placeholders, plugins, className }: PropsWithChildren & {
  verbose?: boolean
  debounce?: number
  placeholders?: boolean
  plugins?: Plugin.Definition[]
  className?: string
}) => {
  const style: React.CSSProperties = {
    position: "relative",
    boxSizing: "border-box",
    textRendering: "optimizeLegibility",
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
  }

  return (
    <div className={className} style={style}>
      <TextbitContextProvider verbose={!!verbose} debounce={debounce} placeholders={placeholders}>
        <PluginRegistryContextProvider verbose={!!verbose} plugins={[
          ...basePlugins,
          ...Array.isArray(plugins) && plugins.length ? plugins : StandardPlugins
        ]}>
          <FocusContextProvider>
            {children}
          </FocusContextProvider>
        </PluginRegistryContextProvider>
      </TextbitContextProvider>
    </div>
  )
}
