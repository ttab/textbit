import React, { PropsWithChildren } from 'react' // Necessary for esbuild
import './style.css'
import { TextbitContextProvider } from './TextbitContext'
import { PluginRegistryContextProvider } from '../PluginRegistry/PluginRegistryContext'
import { Plugin } from '../../types'

import {
  basePlugins,
  StandardPlugins
} from '@/components/core'


export const TextbitRoot = ({ children, verbose, plugins }: PropsWithChildren & {
  verbose?: boolean
  plugins?: Plugin.Definition[]
}) => {
  return (
    <div className="textbit textbit-editor">
      <TextbitContextProvider verbose={!!verbose}>
        <PluginRegistryContextProvider verbose={!!verbose} plugins={[
          ...basePlugins,
          ...Array.isArray(plugins) && plugins.length ? plugins : StandardPlugins
        ]}>
          {children}
        </PluginRegistryContextProvider>
      </TextbitContextProvider>
    </div>
  )
}