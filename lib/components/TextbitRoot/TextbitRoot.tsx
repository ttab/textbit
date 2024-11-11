import React, { type PropsWithChildren } from 'react'
import { type PlaceholdersVisibility, TextbitContextProvider } from './TextbitContext'
import { PluginRegistryContextProvider } from '../PluginRegistry/PluginRegistryContext'
import { type Plugin } from '../../types'

import {
  basePlugins,
  StandardPlugins
} from '../../components/core'
import { TextbitSelectionBoundsProvider } from './TextbitSelectionBoundsProvider'
import { ContextMenuHintsProvider } from '../ContextMenu/ContextMenuHintsContext'


export const TextbitRoot = ({
  children,
  autoFocus,
  onBlur,
  onFocus,
  verbose,
  debounce,
  spellcheckDebounce,
  placeholder,
  placeholders,
  plugins,
  className
}: PropsWithChildren & {
  autoFocus?: boolean
  onBlur?: React.FocusEventHandler<HTMLDivElement>
  onFocus?: React.FocusEventHandler<HTMLDivElement>
  verbose?: boolean
  debounce?: number
  spellcheckDebounce?: number
  placeholders?: PlaceholdersVisibility
  placeholder?: string
  plugins?: Plugin.Definition[]
  className?: string
}) => {
  const style: React.CSSProperties = {
    position: 'relative',
    boxSizing: 'border-box',
    textRendering: 'optimizeLegibility',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale'
  }

  return (
    <div className={className} style={style}>
      <TextbitSelectionBoundsProvider>
        <TextbitContextProvider
          verbose={!!verbose}
          autoFocus={!!autoFocus}
          onBlur={onBlur}
          onFocus={onFocus}
          debounce={debounce}
          spellcheckDebounce={spellcheckDebounce}
          placeholder={placeholder}
          placeholders={placeholders}
        >
          <PluginRegistryContextProvider
            verbose={!!verbose}
            plugins={[
              ...basePlugins.map((p) => p()),
              ...Array.isArray(plugins) && plugins.length ? plugins : StandardPlugins.map((sp) => sp())
            ]}
          >
            <ContextMenuHintsProvider>
              {children}
            </ContextMenuHintsProvider>
          </PluginRegistryContextProvider>
        </TextbitContextProvider>
      </TextbitSelectionBoundsProvider>
    </div>
  )
}
