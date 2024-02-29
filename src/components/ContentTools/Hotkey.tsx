import React from 'react' // Necessary for esbuild
import { modifier } from '@/lib/modifier'

export const Hotkey = ({ hotkey, className }: {
  className?: string
  hotkey?: string
}) => {
  return <div className={className}>
    {modifier(hotkey || '')}
  </div>
}
