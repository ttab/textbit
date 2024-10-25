import React, { PropsWithChildren, createContext } from 'react'
import { useSlateSelection, useSlateStatic } from 'slate-react'
import { BaseSelection, Editor, Element } from 'slate'
import { Plugin } from '@/types'
import { pipeFromFileInput } from '@/lib/pipes'
import { PluginRegistryAction, usePluginRegistry } from '@/components/PluginRegistry'
import { TextbitElement } from '@/lib'


// {
//   isOpen: !!context.menu,
//   position: context.menu ? {
//     x: context.menu.x,
//     y: context.menu.y
//   } : undefined,
//   target: context.menu?.target,
//   event: context.menu?.originalEvent,
//   nodeEntry: context.menu?.nodeEntry,
//   spelling: context.spelling
// }

type ItemProps = PropsWithChildren & {
  className?: string
  func?: () => void
}

export const Item = ({
  children,
  className,
  func = undefined
}: ItemProps) => {
  if (!func) {
    return <></>
  }

  return (
    <a
      className={className}
      onMouseDown={(e) => {
        e.preventDefault()
        func()
      }}
    >
      {children}
    </a>
  )
}
